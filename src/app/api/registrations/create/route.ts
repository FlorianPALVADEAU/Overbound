import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { sendReceiptEmail, sendTicketEmail } from '@/lib/email'
import { notifyDocumentRequired } from '@/lib/email/documents'
import { notifyAmbassadorRewardsForOrder } from '@/lib/ambassadors/rewardsNotifications'
import * as QRCode from 'qrcode'
import { REGULATION_VERSION, DISTANCE_MIN_KM, DISTANCE_MAX_KM } from '@/constants/registration'
import { captureException } from '@/lib/sentry'
import {
  assignOpenWaveToRegistration,
  type OpenWaveAssignment,
  formatWaveStartTime,
  getRankedStartTime,
  isOpenFormatTicket,
  isRankedFormatTicket,
} from '@/lib/openSas'
import { sendAdminPushNotification } from '@/lib/push'

export const runtime = 'nodejs'

const hasAmbassadorLink = (value: unknown) => {
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value && typeof value === 'object')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-08-27.basil',
})

const isPpsOnlyAndTooEarly = (eventDate: string | null | undefined, documentTypes: string[] | null | undefined) => {
  if (!eventDate || !documentTypes || documentTypes.length === 0) return false
  const isPpsOnly = documentTypes.every((type) => String(type || '').toLowerCase().includes('pps'))
  if (!isPpsOnly) return false
  const earliestAllowed = new Date(eventDate)
  earliestAllowed.setMonth(earliestAllowed.getMonth() - 3)
  return Date.now() < earliestAllowed.getTime()
}

export async function POST(request: NextRequest) {
  try {
    const {
      paymentIntentId,
      eventId,
      userId,
      ticketSelections = [],
      participants = [],
      upsells = [],
      promoCode = null,
      ambassadorReferralCode = null,
      signatureImage = null,
      signatureMetadata = {},
      disclaimer = { read: false, accepted: false },
    } = await request.json() as {
      paymentIntentId: string
      eventId: string
      userId: string
      ticketSelections: Array<{ ticketId: string; quantity: number }>
      participants: Array<{
        ticketId: string
        firstName: string
        lastName: string
        email: string
        birthDate?: string
        emergencyContactName?: string
        emergencyContactPhone?: string
        medicalInfo?: string
        licenseNumber?: string
        distanceIdealKm?: string | number
        distanceMinKm?: string | number
        difficultyLevel?: 'low' | 'mid' | 'hard' | null
      }>
      upsells: Array<{ upsellId: string; quantity: number; meta?: Record<string, any> }>
      promoCode: string | null
      ambassadorReferralCode?: string | null
      signatureImage: string | null
      signatureMetadata: Record<string, any>
      disclaimer: { read: boolean; accepted: boolean }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound-race.com'

    if (!paymentIntentId || !eventId || !userId || ticketSelections.length === 0 || participants.length === 0) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Verify PaymentIntent is successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 400 })
    }

    // Check if registration already exists for this PaymentIntent
    const { data: existingReg } = await supabase
      .from('registrations')
      .select('id')
      .or(`stripe_payment_intent_id.eq.${paymentIntentId},and(provider.eq.internal,provider_registration_id.eq.${paymentIntentId})`)
      .maybeSingle()

    if (existingReg) {
      return NextResponse.json({ error: 'Inscription déjà créée pour ce paiement' }, { status: 409 })
    }

    const admin = supabaseAdmin()

    // Get event info with price tiers
    const { data: eventRow, error: eventError } = await admin
      .from('events')
      .select('id, title, date, location, price_tiers:event_price_tiers(*)')
      .eq('id', eventId)
      .single()

    if (eventError || !eventRow) {
      return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 })
    }

    const ticketIds = ticketSelections.map((item: any) => item.ticketId)

    const { data: tickets, error: ticketsError } = await admin
      .from('tickets')
      .select(
        `
        *,
        race:races!tickets_race_id_fkey (
          id,
          name,
          distance_km
        )
      `,
      )
      .in('id', ticketIds)

    if (ticketsError || !tickets || tickets.length === 0) {
      return NextResponse.json({ error: 'Billets introuvables.' }, { status: 404 })
    }

    const ticketMap = new Map<string, any>()
    tickets.forEach((ticket) => {
      ticketMap.set(ticket.id, ticket)
    })

    // Generate unique tokens
    const generateTokens = () => ({ qr: uuidv4(), transfer: uuidv4() })

    // Calculate ticket subtotal with event price tiers (including tier capacity splits)
    const eventPriceTiers = (eventRow as any).price_tiers || []
    const tiersById = new Map<string, any>(eventPriceTiers.map((tier: any) => [tier.id, tier]))

    let tierAllocations: Array<{ tier_id: string; quantity: number }> = []
    try {
      const rawAllocations = paymentIntent.metadata?.tier_allocations
      if (rawAllocations) {
        const parsed = JSON.parse(rawAllocations)
        if (Array.isArray(parsed)) {
          tierAllocations = parsed
            .filter((item) => item && typeof item.tier_id === 'string' && typeof item.quantity === 'number')
            .map((item) => ({ tier_id: item.tier_id, quantity: item.quantity }))
        }
      }
    } catch {
      tierAllocations = []
    }

    const participantTierIds: Array<string | null> = []
    for (const allocation of tierAllocations) {
      for (let i = 0; i < allocation.quantity; i += 1) {
        participantTierIds.push(allocation.tier_id)
      }
    }

    if (participantTierIds.length < participants.length) {
      participantTierIds.push(...Array.from({ length: participants.length - participantTierIds.length }, () => null))
    } else if (participantTierIds.length > participants.length) {
      participantTierIds.length = participants.length
    }

    const ticketLineItems = new Map<
      string,
      { ticketId: string; tierId: string | null; unitPrice: number; quantity: number }
    >()
    let ticketSubtotal = 0

    participants.forEach((participant, index) => {
      const ticket = ticketMap.get(participant.ticketId)
      if (!ticket) return
      const basePrice = ticket.final_price_cents ?? ticket.base_price_cents
      if (basePrice == null || basePrice === 0) return

      const tierId = participantTierIds[index] ?? null
      const tier = tierId ? tiersById.get(tierId) : null
      const discountMultiplier = tier ? 1 - tier.discount_percentage / 100 : 1
      const unitPrice = Math.round(basePrice * discountMultiplier)

      const key = `${ticket.id}:${tierId ?? 'base'}`
      const existing = ticketLineItems.get(key)
      if (existing) {
        existing.quantity += 1
      } else {
        ticketLineItems.set(key, { ticketId: ticket.id, tierId, unitPrice, quantity: 1 })
      }
      ticketSubtotal += unitPrice
    })

    const { data: upsellRows } = await admin
      .from('upsells')
      .select('*')
      .eq('is_active', true)
      .or(`event_id.eq.${eventId},event_id.is.null`)

    const upsellMap = new Map<string, any>()
    for (const row of upsellRows || []) {
      upsellMap.set(row.id, row)
    }

    const upsellSubtotal = upsells.reduce((accumulator: number, item: { upsellId: string; quantity: number }) => {
      const upsell = upsellMap.get(item.upsellId)
      if (!upsell) return accumulator
      return accumulator + upsell.price_cents * (item.quantity || 0)
    }, 0)

    const discountApplied = Number(paymentIntent.metadata?.discount_applied || 0) || 0

    const promoCodeFromMetadata = paymentIntent.metadata?.promo_code || null
    const appliedPromoCode = (
      typeof promoCodeFromMetadata === 'string' && promoCodeFromMetadata.trim().length > 0
        ? promoCodeFromMetadata
        : promoCode
    )?.trim().toUpperCase() || null

    let promotionalCodeId: string | null = null
    if (appliedPromoCode) {
      const { data: promoRecord } = await admin
        .from('promotional_codes')
        .select('id')
        .ilike('code', appliedPromoCode)
        .maybeSingle()

      promotionalCodeId = promoRecord?.id ?? null
    }

    const ambassadorReferralFromMetadata = paymentIntent.metadata?.ambassador_referral_code || null
    const ambassadorReferralCandidate = (
      typeof ambassadorReferralCode === 'string' && ambassadorReferralCode.trim().length > 0
        ? ambassadorReferralCode
        : ambassadorReferralFromMetadata
    )?.trim().toUpperCase() || null

    let ambassadorReferralPromoId: string | null = null
    if (ambassadorReferralCandidate) {
      const { data: ambassadorPromo } = await admin
        .from('promotional_codes')
        .select('id, ambassadors:ambassadors(id)')
        .ilike('code', ambassadorReferralCandidate)
        .maybeSingle()

      const isAmbassadorCode = hasAmbassadorLink((ambassadorPromo as any)?.ambassadors)

      ambassadorReferralPromoId = isAmbassadorCode ? ambassadorPromo?.id ?? null : null
    }

    const registrationPromotionalCodeId = ambassadorReferralPromoId ?? promotionalCodeId

    // Create order record
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        user_id: userId,
        email: user.email,
        status: 'paid',
        amount_total: paymentIntent.amount,
        currency: paymentIntent.currency,
        provider: 'stripe',
        provider_order_id: paymentIntent.id,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Erreur création commande:', orderError)
      throw orderError
    }

    const createdRegistrations: any[] = []
    let openGroupAnchor: OpenWaveAssignment | null = null
    let openGroupCount = 0

    for (const [index, participant] of participants.entries()) {
      const ticket = ticketMap.get(participant.ticketId)
      if (!ticket) {
        continue
      }

      const isOpenFormat = isOpenFormatTicket(ticket.name, ticket.race?.name ?? null)
      const isRankedFormat = isRankedFormatTicket(ticket.name, ticket.race?.name ?? null)
      const distanceIdealRaw = String(participant.distanceIdealKm ?? '').trim()
      const distanceMinRaw = String(participant.distanceMinKm ?? '').trim()
      const distanceIdeal = Number(distanceIdealRaw)
      const distanceMin = Number(distanceMinRaw)

      if (isOpenFormat) {
        if (!distanceIdealRaw || !distanceMinRaw || !Number.isFinite(distanceIdeal) || !Number.isFinite(distanceMin)) {
          return NextResponse.json({ error: 'Distances participant invalides.' }, { status: 422 })
        }

        if (distanceIdeal < distanceMin) {
          return NextResponse.json({ error: 'Distance idéale inférieure à la distance minimale.' }, { status: 422 })
        }

        if (
          distanceIdeal < DISTANCE_MIN_KM ||
          distanceIdeal > DISTANCE_MAX_KM ||
          distanceMin < DISTANCE_MIN_KM ||
          distanceMin > DISTANCE_MAX_KM
        ) {
          return NextResponse.json({ error: 'Distances participant hors limite.' }, { status: 422 })
        }
      }

      const { qr, transfer } = generateTokens()
      const eventPriceTierId = participantTierIds[index] ?? null

      const { data: registration, error: registrationError } = await admin
        .from('registrations')
        .insert({
          user_id: userId,
          event_id: eventId,
          ticket_id: participant.ticketId,
          event_price_tier_id: eventPriceTierId,
          order_id: order.id,
          email: participant.email || user.email,
          provider: 'internal',
          provider_registration_id: null, // avoid unique collisions across multiple participants
          stripe_payment_intent_id: paymentIntent.id,
          qr_code_token: qr,
          transfer_token: transfer,
          checked_in: false,
          claim_status: 'pending',
          approval_status: 'pending',
          race_id: ticket.race?.id || null,
          promotional_code_id: registrationPromotionalCodeId,
          difficulty_level: participant.difficultyLevel || null,
          // DB constraints require non-null positive distances; for non-OPEN formats
          // we store a neutral placeholder and skip OPEN SAS logic.
          distance_ideal_km: isOpenFormat ? distanceIdeal : 1,
          distance_min_km: isOpenFormat ? distanceMin : 1,
        })
        .select()
        .single()

      if (registrationError || !registration) {
        console.error('Erreur création inscription:', registrationError)
        throw registrationError
      }

      const derivedName = `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim()
      const participantName = derivedName || participant.email || registration.email || null

      try {
        if (isOpenFormat) {
          if (!openGroupAnchor) {
            const assignment = await assignOpenWaveToRegistration({
              admin,
              eventId,
              registrationId: registration.id,
              eventDateIso: eventRow.date,
              ticketName: ticket.name,
              raceName: ticket.race?.name ?? null,
              distanceIdealKm: distanceIdeal,
              distanceMinKm: distanceMin,
            })

            if (assignment) {
              openGroupAnchor = assignment
              openGroupCount = 1
              registration.start_time = assignment.startTime
              registration.wave_index = assignment.waveIndex
              registration.wave_capacity = assignment.waveCapacity
              registration.wave_position = assignment.wavePosition
              registration.auto_assigned = true
              registration.preferred_window_start = assignment.preferredWindowStart
              registration.preferred_window_end = assignment.preferredWindowEnd
              registration.latest_allowed_time = assignment.latestAllowedTime
              registration.assignment_constraint_breached = assignment.assignmentConstraintBreached
            }
          } else {
            openGroupCount += 1
            const copiedWavePosition = (openGroupAnchor.wavePosition ?? 1) + openGroupCount - 1
            const { error: syncOpenError } = await admin
              .from('registrations')
              .update({
                start_time: openGroupAnchor.startTime,
                wave_index: openGroupAnchor.waveIndex,
                wave_capacity: openGroupAnchor.waveCapacity,
                wave_position: copiedWavePosition,
                auto_assigned: true,
                preferred_window_start: openGroupAnchor.preferredWindowStart,
                preferred_window_end: openGroupAnchor.preferredWindowEnd,
                latest_allowed_time: openGroupAnchor.latestAllowedTime,
                assignment_constraint_breached: openGroupAnchor.assignmentConstraintBreached,
              })
              .eq('id', registration.id)

            if (syncOpenError) {
              throw syncOpenError
            }

            registration.start_time = openGroupAnchor.startTime
            registration.wave_index = openGroupAnchor.waveIndex
            registration.wave_capacity = openGroupAnchor.waveCapacity
            registration.wave_position = copiedWavePosition
            registration.auto_assigned = true
            registration.preferred_window_start = openGroupAnchor.preferredWindowStart
            registration.preferred_window_end = openGroupAnchor.preferredWindowEnd
            registration.latest_allowed_time = openGroupAnchor.latestAllowedTime
            registration.assignment_constraint_breached = openGroupAnchor.assignmentConstraintBreached
          }
        } else if (isRankedFormat) {
          const rankedStart = getRankedStartTime(eventRow.date).toISOString()
          const { error: rankedUpdateError } = await admin
            .from('registrations')
            .update({
              start_time: rankedStart,
              auto_assigned: true,
              wave_index: null,
              wave_capacity: null,
              wave_position: null,
              preferred_window_start: null,
              preferred_window_end: null,
              latest_allowed_time: null,
              assignment_constraint_breached: false,
            })
            .eq('id', registration.id)

          if (rankedUpdateError) {
            throw rankedUpdateError
          }

          registration.start_time = rankedStart
          registration.auto_assigned = true
        }
      } catch (assignmentError) {
        console.error('Erreur attribution SAS OPEN:', assignmentError)
        throw assignmentError
      }

      createdRegistrations.push({ registration, ticket, participant, participantName })

      if (ticket.requires_document) {
        const tooEarlyForPpsOnly = isPpsOnlyAndTooEarly(eventRow.date, ticket.document_types ?? [])
        if (!tooEarlyForPpsOnly) {
          await notifyDocumentRequired({
            registrationId: registration.id,
            userId: registration.user_id,
            participantName,
            eventTitle: eventRow.title,
            email: registration.email,
            requiredDocuments: ticket.document_types ?? [],
          })
        }
      }

      if (signatureImage) {
        const signatureRecord = {
          registration_id: registration.id,
          regulation_version: typeof signatureMetadata?.regulationVersion === 'string'
            ? signatureMetadata.regulationVersion
            : REGULATION_VERSION,
          signed_at:
            typeof signatureMetadata?.signedAt === 'string'
              ? signatureMetadata.signedAt
              : new Date().toISOString(),
          signature_data: JSON.stringify({
            imageDataUrl: signatureImage,
            participant: {
        firstName: participant.firstName,
        lastName: participant.lastName,
        email: participant.email,
        birthDate: participant.birthDate,
        emergencyContactName: participant.emergencyContactName,
        emergencyContactPhone: participant.emergencyContactPhone,
        medicalInfo: participant.medicalInfo,
        licenseNumber: participant.licenseNumber,
        distanceIdealKm: participant.distanceIdealKm,
        distanceMinKm: participant.distanceMinKm,
      },
            disclaimer,
          }),
        }

        const { error: signatureError } = await admin
          .from('registration_signatures')
          .insert(signatureRecord)

        if (signatureError) {
          console.error('Erreur création signature:', signatureError)
        }
      }
    }

    if (openGroupAnchor && openGroupCount > 1) {
      const { data: waveRow, error: waveFetchError } = await admin
        .from('event_waves')
        .select('id, assigned_count')
        .eq('event_id', eventId)
        .eq('wave_index', openGroupAnchor.waveIndex)
        .maybeSingle()

      if (waveFetchError) {
        console.error('Erreur récupération compteur SAS OPEN:', waveFetchError)
      } else if (waveRow?.id) {
        const extraAssigned = openGroupCount - 1
        const { error: waveUpdateError } = await admin
          .from('event_waves')
          .update({
            assigned_count: (waveRow.assigned_count ?? 0) + extraAssigned,
            updated_at: new Date().toISOString(),
          })
          .eq('id', waveRow.id)

        if (waveUpdateError) {
          console.error('Erreur mise à jour compteur SAS OPEN:', waveUpdateError)
        }
      }
    }

    if (upsells && upsells.length > 0 && createdRegistrations.length > 0) {
      const referenceRegistration = createdRegistrations[0].registration
      const upsellRecords = upsells
        .map((item: { upsellId: string; quantity: number; meta?: Record<string, any> }) => {
          const upsell = upsellMap.get(item.upsellId)
          const quantity = Number(item.quantity || 0)
          if (!upsell) return null
          if (!Number.isFinite(quantity) || quantity <= 0) return null
          return {
            registration_id: referenceRegistration.id,
            name: upsell.name,
            price_cents: upsell.price_cents,
            quantity,
            currency: upsell.currency || paymentIntent.currency,
            meta: item.meta ?? null,
          }
        })
        .filter(Boolean)

      if (upsellRecords.length > 0) {
        const { error: upsellError } = await admin
          .from('registration_upsells')
          .insert(upsellRecords)

        if (upsellError) {
          if ((upsellError as any)?.code === 'PGRST205') {
            console.warn('Table registration_upsells absente, upsells ignorés.')
          } else {
            console.error('Erreur création upsells:', upsellError)
          }
        }
      }
    }

    // Increment promotional code usage count
    if (promotionalCodeId) {
      const { error: promoIncrementError } = await admin.rpc('increment_promo_code_usage', {
        promo_code_id: promotionalCodeId,
      })

      if (promoIncrementError) {
        console.error('Erreur incrémentation code promo:', promoIncrementError)
        // Non-blocking error: registration is already created, just log it
      }
    }

    // Best effort: if the SQL migration is in place, this keeps points in sync immediately.
    const { error: ambassadorPointsError } = await admin.rpc('award_ambassador_points_for_order', {
      p_order_id: order.id,
    })
    if (ambassadorPointsError) {
      console.error('Erreur attribution points ambassadeur:', ambassadorPointsError)
    } else {
      try {
        await notifyAmbassadorRewardsForOrder(admin, order.id)
      } catch (notificationError) {
        console.error('Erreur notification récompense ambassadeur:', notificationError)
      }
    }

    try {
      const firstRegistration = createdRegistrations[0]
      const participantLabel = firstRegistration?.participantName
        || firstRegistration?.registration?.email
        || user.email
        || null
      const currency = (paymentIntent.currency || 'eur').toUpperCase()
      const amountValue = typeof paymentIntent.amount === 'number' ? paymentIntent.amount / 100 : null
      const amountLabel = amountValue !== null
        ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amountValue)
        : null
      const details = [
        participantLabel,
        eventRow.title,
        amountLabel,
      ].filter(Boolean).join(' • ')

      await sendAdminPushNotification({
        title: 'Nouvelle inscription payée',
        body: details,
        url: `${siteUrl}/dashboard?tab=members&event=${eventRow.id}`,
      })
    } catch (pushError) {
      console.error('[push] notification error', pushError)
    }

    for (const { registration, ticket, participantName } of createdRegistrations) {
      try {
        const qrCodeBase64 = await QRCode.toDataURL(registration.qr_code_token).then((url) => url.split(',')[1])
        const eventDateLabel = new Date(eventRow.date).toLocaleDateString('fr-FR', { dateStyle: 'full' })

        await sendTicketEmail({
          to: registration.email,
          participantName: participantName || registration.email,
          eventTitle: eventRow.title,
          eventDate: eventDateLabel,
          eventLocation: eventRow.location,
          ticketName: ticket.name,
          startTime: formatWaveStartTime(registration.start_time),
          qrUrl: `data:image/png;base64,${qrCodeBase64}`,
          manageUrl: `${siteUrl}/account/tickets?ticket=${registration.id}`,
        })
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError)
        // Capture email send errors in Sentry
        captureException(emailError as Error, {
          context: 'ticket_email_send',
          registrationId: registration.id,
          email: registration.email,
        })
      }
    }

    try {
      if (user.email) {
        const ticketItems = Array.from(ticketLineItems.values())
          .map((item) => {
            const ticket = ticketMap.get(item.ticketId)
            if (!ticket) return null
            const tierLabel = item.tierId ? ` — ${tiersById.get(item.tierId)?.name ?? 'Palier'}` : ''
            return {
              description: `${eventRow.title} — ${ticket.name}${tierLabel}`,
              quantity: item.quantity,
              unitPrice: toMajor(item.unitPrice),
              total: toMajor(item.unitPrice * item.quantity),
            }
          })
          .filter(Boolean) as Array<{
            description: string
            quantity: number
            unitPrice: number
            total: number
          }>

        const upsellItems = upsells
          .map((item: { upsellId: string; quantity: number }) => {
            const upsell = upsellMap.get(item.upsellId)
            if (!upsell) return null
            const quantity = item.quantity || 0
            const unitPriceCents = upsell.price_cents

            return {
              description: upsell.name,
              quantity,
              unitPrice: toMajor(unitPriceCents),
              total: toMajor(unitPriceCents * quantity),
            }
          })
          .filter(Boolean) as Array<{
            description: string
            quantity: number
            unitPrice: number
            total: number
          }>

        const receiptItems = [...ticketItems, ...upsellItems]
        const subtotalCents = ticketSubtotal + upsellSubtotal
        const discountCents = discountApplied > 0 ? discountApplied : 0
        const totalCents = paymentIntent.amount ?? Math.max(subtotalCents - discountCents, 0)

        await sendReceiptEmail({
          to: user.email,
          fullName:
            typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null,
          invoiceNumber: order.id,
          invoiceDate: new Date(order.created_at ?? Date.now()).toLocaleDateString('fr-FR', { dateStyle: 'full' }),
          eventName: eventRow.title,
          items: receiptItems,
          subtotal: toMajor(subtotalCents),
          discount: discountCents > 0 ? toMajor(discountCents) : undefined,
          discountLabel: discountCents > 0 ? (promoCode ? `Code promo ${promoCode}` : 'Réduction') : undefined,
          total: toMajor(totalCents),
          currency: (paymentIntent.currency || 'eur').toUpperCase(),
          paymentMethod: formatPaymentMethod(paymentIntent.payment_method_types?.[0]),
          invoiceUrl: order.invoice_url ?? undefined,
        })
      }
    } catch (emailError) {
      console.error('Erreur envoi reçu:', emailError)
      captureException(emailError as Error, {
        context: 'receipt_email_send',
        orderId: order.id,
        email: user.email,
      })
    }

    console.log('Inscriptions créées avec succès:', {
      order_id: order.id,
      registrations: createdRegistrations.map(({ registration }) => registration.id),
      user_id: userId,
      event_id: eventId,
      amount: paymentIntent.amount,
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount_total: order.amount_total,
        currency: order.currency,
        payment_status: order.payment_status,
      },
      registrations: createdRegistrations.map(({ registration }) => registration.id),
    })

  } catch (error: any) {
    console.error('Erreur création inscription:', error)

    // Capture error in Sentry with context
    captureException(error, {
      route: '/api/registrations/create',
      method: 'POST',
    })

    return NextResponse.json({
      error: 'Erreur lors de la création de l\'inscription',
      details: error.message
    }, { status: 500 })
  }
}

const toMajor = (amountCents: number) => amountCents / 100

const formatPaymentMethod = (method?: string | null) => {
  switch (method) {
    case 'card':
      return 'Carte bancaire'
    case 'paypal':
      return 'PayPal'
    case 'link':
      return 'Link'
    default:
      return method ? method.toUpperCase() : 'Paiement'
  }
}
