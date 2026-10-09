import { ticketUsesWaveSelection } from '@/lib/tickets/operationsProfile'
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { sendReceiptEmail, sendTicketEmail } from '@/lib/email'
import { notifyAmbassadorRewardsForOrder } from '@/lib/ambassadors/rewardsNotifications'
import * as QRCode from 'qrcode'
import { REGULATION_VERSION } from '@/constants/registration'
import { keepHealthDataWithConsent } from '@/lib/legal/healthData'
import { fingerprintWaiver } from '@/lib/legal/waiverDocument'
import { FLEXIBLE_TICKET_FEE_CENTS, parseNumberList } from '@/lib/tickets/flexibleTicket'
import { captureException } from '@/lib/sentry'
import {
  formatWaveStartTime,
  getRankedStartTime,
  isOpenFormatTicket,
  isRankedFormatTicket,
} from '@/lib/openSas'
import {
  assignSelectedWaveToRegistration,
  syncRegistrationToGroupAnchor,
  SelectedWaveUnavailableError,
  type SelectedWaveAssignment,
} from '@/lib/selectedWaveAssignment'
import { assignBibNumber, BibCapacityExhaustedError, type RaceFormat } from '@/lib/bibNumber'
import { sendAdminPushNotification } from '@/lib/push'
import { sendMetaCapiEvent } from '@/lib/analytics/metaCapi'
import { markResendContactAsRegistered } from '@/lib/email/resendAudiences'
import type { EventPriceTier } from '@/types/EventPriceTier'
import { validateUpsellQuantities } from '@/lib/upsells/quantity'

export const runtime = 'nodejs'

const hasAmbassadorLink = (value: unknown) => {
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value && typeof value === 'object')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-08-27.basil',
})

const participantSchema = z.object({
  ticketId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  birthDate: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  medicalInfo: z.string().optional(),
  healthDataConsent: z.boolean().optional(),
  licenseNumber: z.string().optional(),
  selectedWaveIndex: z.number().int().positive().nullable().optional(),
})

const createRegistrationBodySchema = z.object({
  paymentIntentId: z.string(),
  eventId: z.string(),
  userId: z.string(),
  ticketSelections: z.array(z.object({ ticketId: z.string(), quantity: z.number() })).default([]),
  participants: z.array(participantSchema).default([]),
  upsells: z
    .array(z.object({ upsellId: z.string(), quantity: z.number(), meta: z.record(z.string(), z.any()).optional() }))
    .default([]),
  promoCode: z.string().nullable().default(null),
  promoCodes: z.array(z.string()).default([]),
  ambassadorReferralCode: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
  signatureImage: z.string().nullable().default(null),
  signatureMetadata: z.record(z.string(), z.any()).default({}),
  disclaimer: z
    .object({
      read: z.boolean(),
      accepted: z.boolean(),
      rulebookAccepted: z.boolean().optional(),
      groupAttestation: z.boolean().optional(),
    })
    .default({ read: false, accepted: false, rulebookAccepted: false }),
  freeOrderMetadata: z.record(z.string(), z.string()).nullable().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const clientIpAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      null
    const clientUserAgent = request.headers.get('user-agent')
    const fbpCookie = request.cookies.get('_fbp')?.value ?? null
    const fbcCookie = request.cookies.get('_fbc')?.value ?? null

    const parsedBody = createRegistrationBodySchema.safeParse(await request.json())
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    const {
      paymentIntentId,
      eventId,
      userId,
      ticketSelections,
      participants,
      upsells,
      promoCode,
      promoCodes,
      ambassadorReferralCode = null,
      groupId = null,
      signatureImage,
      signatureMetadata,
      disclaimer,
      freeOrderMetadata = null,
    } = parsedBody.data

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound-race.com'

    if (!paymentIntentId || !eventId || !userId || ticketSelections.length === 0 || participants.length === 0) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    const hasSignature =
      typeof signatureImage === 'string' && signatureImage.trim().length > 0
    const hasAcceptedDisclaimer =
      Boolean(disclaimer?.read) &&
      Boolean(disclaimer?.accepted) &&
      Boolean(disclaimer?.rulebookAccepted)

    if (!hasSignature || !hasAcceptedDisclaimer) {
      return NextResponse.json(
        { error: 'Signature, décharge et règlement officiel obligatoires avant paiement.' },
        { status: 422 },
      )
    }

    const supabase = await createSupabaseServer()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const isFreeOrder = typeof paymentIntentId === 'string' && paymentIntentId.startsWith('free_')

    // Verify PaymentIntent is successful (or synthesize for free orders)
    let paymentIntent: {
      id: string
      status: string
      amount: number
      currency: string
      metadata: Record<string, string>
      payment_method_types: string[]
    }

    if (isFreeOrder) {
      const meta = freeOrderMetadata || {}
      paymentIntent = {
        id: paymentIntentId,
        status: 'succeeded',
        amount: 0,
        currency: meta.currency || 'eur',
        metadata: {
          tier_allocations: meta.tier_allocations || '[]',
          discount_applied: meta.discount_applied || '0',
          promo_code: meta.promo_code || '',
          promo_codes: meta.promo_codes || '',
          ambassador_referral_code: meta.ambassador_referral_code || '',
        },
        payment_method_types: ['free'],
      }
    } else {
      const stripeIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      if (stripeIntent.status !== 'succeeded') {
        if (stripeIntent.status === 'processing' || stripeIntent.status === 'requires_capture') {
          return NextResponse.json(
            {
              pending: true,
              payment_intent_status: stripeIntent.status,
              message: 'Paiement en cours de confirmation',
            },
            { status: 202 },
          )
        }
        return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 400 })
      }
      paymentIntent = {
        id: stripeIntent.id,
        status: stripeIntent.status,
        amount: stripeIntent.amount,
        currency: stripeIntent.currency,
        metadata: (stripeIntent.metadata || {}) as Record<string, string>,
        payment_method_types: stripeIntent.payment_method_types as string[],
      }
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
      .select('id, title, date, location, open_bib_capacity, ranked_bib_capacity, price_tiers:event_price_tiers(*)')
      .eq('id', eventId)
      .single()

    if (eventError || !eventRow) {
      return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 })
    }

    const ticketIds = ticketSelections.map((item) => item.ticketId)

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

    const ticketMap = new Map<string, (typeof tickets)[number]>()
    tickets.forEach((ticket) => {
      ticketMap.set(ticket.id, ticket)
    })

    // Generate unique tokens
    const generateTokens = () => ({ qr: uuidv4(), transfer: uuidv4() })

    // Calculate ticket subtotal with event price tiers (including tier capacity splits)
    const eventPriceTiers = (eventRow.price_tiers as EventPriceTier[] | null) || []
    const tiersById = new Map<string, EventPriceTier>(eventPriceTiers.map((tier) => [tier.id, tier]))

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

    const upsellQuantityError = validateUpsellQuantities(
      upsells,
      new Map(Array.from(upsellMap.values()).map((upsell) => [upsell.id, upsell])),
      participants.length,
    )
    if (upsellQuantityError) {
      return NextResponse.json({ error: upsellQuantityError }, { status: 422 })
    }

    const upsellSubtotal = upsells.reduce((accumulator: number, item: { upsellId: string; quantity: number }) => {
      const upsell = upsellMap.get(item.upsellId)
      if (!upsell) return accumulator
      return accumulator + upsell.price_cents * (item.quantity || 0)
    }, 0)

    const discountApplied = Number(paymentIntent.metadata?.discount_applied || 0) || 0

    const promoCodesFromMetadata = paymentIntent.metadata?.promo_codes || null
    const promoCodeFromMetadata = paymentIntent.metadata?.promo_code || null
    const fallbackPayloadCodes = Array.isArray(promoCodes) ? promoCodes : []
    const normalizedPromoCodes = [...new Set([
      ...(typeof promoCodesFromMetadata === 'string'
        ? promoCodesFromMetadata.split(',').map((value) => value.trim().toUpperCase()).filter((value) => value.length > 0)
        : []),
      ...(typeof promoCodeFromMetadata === 'string' && promoCodeFromMetadata.trim().length > 0
        ? [promoCodeFromMetadata.trim().toUpperCase()]
        : []),
      ...fallbackPayloadCodes
        .map((value) => String(value ?? '').trim().toUpperCase())
        .filter((value) => value.length > 0),
      ...(typeof promoCode === 'string' && promoCode.trim().length > 0 ? [promoCode.trim().toUpperCase()] : []),
    ])]

    const promotionalCodeIds = new Set<string>()
    for (const appliedCode of normalizedPromoCodes) {
      const { data: promoRecord } = await admin
        .from('promotional_codes')
        .select('id')
        .ilike('code', appliedCode)
        .maybeSingle()

      if (promoRecord?.id) {
        promotionalCodeIds.add(promoRecord.id)
      }
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

      const isAmbassadorCode = hasAmbassadorLink(ambassadorPromo?.ambassadors)

      ambassadorReferralPromoId = isAmbassadorCode ? ambassadorPromo?.id ?? null : null
    }

    const registrationPromotionalCodeId = ambassadorReferralPromoId ?? Array.from(promotionalCodeIds)[0] ?? null

    // Create order record
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        user_id: userId,
        email: user.email,
        status: 'paid',
        amount_total: paymentIntent.amount,
        currency: paymentIntent.currency,
        provider: isFreeOrder ? 'free' : 'stripe',
        provider_order_id: paymentIntent.id,
      })
      .select()
      .single()

    if (orderError?.code === '23505') {
      // Concurrent request raced us: another request already created the order
      // for this PaymentIntent. Same idempotent response as the pre-check above.
      return NextResponse.json({ error: 'Inscription déjà créée pour ce paiement' }, { status: 409 })
    }

    if (orderError || !order) {
      console.error('Erreur création commande:', orderError)
      throw orderError
    }

    interface CreatedRegistrationRecord {
      id: string
      email: string | null
      qr_code_token: string
      start_time: string | null
      wave_index: number | null
      wave_capacity: number | null
      wave_position: number | null
      auto_assigned: boolean | null
      assignment_constraint_breached: boolean
      bib_number: number | null
      race_format: RaceFormat | null
    }

    const createdRegistrations: Array<{
      registration: CreatedRegistrationRecord
      ticket: (typeof tickets)[number]
      participant: (typeof participants)[number]
      participantName: string | null
    }> = []

    // If the user belongs to a group with an active anchor on this event,
    // every OPEN registration for this order is forced onto that wave
    // (FDR-0005). Otherwise, the participant's own selectedWaveIndex is
    // used and the first OPEN registration becomes the group's anchor.
    let groupAnchorWaveIndex: number | null = null
    if (groupId) {
      const { data: groupRow } = await admin
        .from('groups')
        .select('id, anchor_event_id, anchor_wave_index')
        .eq('id', groupId)
        .maybeSingle()

      if (groupRow && groupRow.anchor_event_id === eventId && groupRow.anchor_wave_index !== null) {
        groupAnchorWaveIndex = groupRow.anchor_wave_index as number
      }
    }
    let groupAnchorAlreadySet = groupAnchorWaveIndex !== null

    // Server-computed at PaymentIntent creation and paid for: never trusted from the request body.
    const flexibleParticipantIndices = new Set(
      isFreeOrder ? [] : parseNumberList(paymentIntent.metadata.flexible_participants),
    )
    const paidTicketPrices = isFreeOrder ? [] : parseNumberList(paymentIntent.metadata.ticket_prices)

    for (const [index, participant] of participants.entries()) {
      const ticket = ticketMap.get(participant.ticketId)
      if (!ticket) {
        continue
      }

      const isOpenFormat = isOpenFormatTicket(ticket.name, ticket.race?.name ?? null)
      // Slot selection follows the ticket's explicit configuration, not its name.
      const usesWaveSelection = ticketUsesWaveSelection(ticket)
      const isRankedFormat = isRankedFormatTicket(ticket.name, ticket.race?.name ?? null)
      if (usesWaveSelection) {
        // A member of an already-anchored group never chooses their SAS
        // (FDR-0005 anchor always wins) — only an unanchored participant
        // must submit an explicit selection (FDR-0012 §3.2).
        if (groupAnchorWaveIndex === null && !participant.selectedWaveIndex) {
          return NextResponse.json({ error: 'SAS_SELECTION_REQUIRED: choix du SAS requis.' }, { status: 422 })
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
          approval_status: 'approved',
          race_id: ticket.race?.id || null,
          promotional_code_id: registrationPromotionalCodeId,
          // The distance columns are NOT NULL with no default and are no longer
          // collected: store the neutral placeholder.
          distance_ideal_km: 1,
          distance_min_km: 1,
          flexible_refund: flexibleParticipantIndices.has(index),
          paid_ticket_cents: isFreeOrder ? 0 : (paidTicketPrices[index] ?? null),
        })
        .select()
        .single()

      if (registrationError || !registration) {
        console.error('Erreur création inscription:', registrationError)
        throw registrationError
      }

      const derivedName = `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim()
      const participantName = derivedName || participant.email || registration.email || null

      // Bib number: independent of wave/SAS assignment, atomic, immutable
      // once set (FDR-0011). Skipped only for tickets that are neither
      // OPEN nor RANKED (kids/relay formats not covered by this scheme).
      if (isOpenFormat || isRankedFormat) {
        const raceFormat: RaceFormat = isOpenFormat ? 'open' : 'ranked'
        const maxBibNumber = isOpenFormat ? eventRow.open_bib_capacity : eventRow.ranked_bib_capacity

        if (!maxBibNumber || maxBibNumber <= 0) {
          console.error(`Capacité dossard non configurée pour l'événement ${eventId} (${raceFormat})`)
          return NextResponse.json(
            { error: `Capacité dossard non configurée pour ce format (${raceFormat}).` },
            { status: 422 },
          )
        }

        try {
          const bibNumber = await assignBibNumber({
            admin,
            eventId,
            registrationId: registration.id,
            raceFormat,
            maxBibNumber,
          })
          registration.bib_number = bibNumber
          registration.race_format = raceFormat
        } catch (bibError) {
          if (bibError instanceof BibCapacityExhaustedError) {
            return NextResponse.json({ error: 'Plus aucun dossard disponible pour ce format.' }, { status: 422 })
          }
          console.error('Erreur attribution dossard:', bibError)
          throw bibError
        }
      }

      if (usesWaveSelection) {
        let assignment: SelectedWaveAssignment
        try {
          if (groupAnchorWaveIndex !== null) {
            // Anchor always wins over any selection submitted by the client (FDR-0005/FDR-0012 §3.3).
            assignment = await syncRegistrationToGroupAnchor({
              admin,
              eventId,
              registrationId: registration.id,
              waveIndex: groupAnchorWaveIndex,
            })
          } else {
            // Zod allows null/undefined; validated non-null above when no anchor applies.
            const waveIndex = participant.selectedWaveIndex as number
            assignment = await assignSelectedWaveToRegistration({
              admin,
              eventId,
              registrationId: registration.id,
              waveIndex,
            })

            // First OPEN registration of an order for a group without an
            // anchor yet becomes the anchor for all subsequent members.
            if (groupId && !groupAnchorAlreadySet) {
              await admin
                .from('groups')
                .update({
                  anchor_event_id: eventId,
                  anchor_wave_index: assignment.waveIndex,
                  anchor_start_time: assignment.startTime,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', groupId)
              groupAnchorWaveIndex = assignment.waveIndex
              groupAnchorAlreadySet = true
            }
          }
        } catch (assignmentError) {
          if (assignmentError instanceof SelectedWaveUnavailableError) {
            return NextResponse.json({ error: 'SAS choisi indisponible, merci de sélectionner un autre créneau.' }, { status: 422 })
          }
          console.error('Erreur attribution SAS OPEN:', assignmentError)
          throw assignmentError
        }

        registration.start_time = assignment.startTime
        registration.wave_index = assignment.waveIndex
        registration.wave_capacity = assignment.waveCapacity
        registration.wave_position = assignment.wavePosition
        registration.auto_assigned = groupAnchorWaveIndex !== null
        registration.assignment_constraint_breached = false
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
          console.error('Erreur attribution départ RANKED:', rankedUpdateError)
          throw rankedUpdateError
        }

        registration.start_time = rankedStart
        registration.auto_assigned = true
      }

      createdRegistrations.push({ registration, ticket, participant, participantName })

      if (signatureImage) {
        // Text actually served by this deployment; stored so the signed wording can be proven later.
        const signedDocument = fingerprintWaiver()
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
        medicalInfo: keepHealthDataWithConsent(participant.medicalInfo, participant.healthDataConsent),
        healthDataConsent: participant.healthDataConsent === true,
        licenseNumber: participant.licenseNumber,
      },
            disclaimer,
            document: signedDocument,
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

    // event_waves.assigned_count is now incremented atomically, once per
    // participant, inside assign_selected_wave_to_registration /
    // sync_registration_to_group_anchor — no batch counter refresh needed
    // here (FDR-0009 §1.2, FDR-0012 §4).

    if (upsells && upsells.length > 0 && createdRegistrations.length > 0) {
      const referenceRegistration = createdRegistrations[0].registration
      const upsellRecords = upsells
        .map((item) => {
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
          if (upsellError.code === 'PGRST205') {
            console.warn('Table registration_upsells absente, upsells ignorés.')
          } else {
            console.error('Erreur création upsells:', upsellError)
          }
        }
      }
    }

    if (ambassadorReferralPromoId) {
      promotionalCodeIds.add(ambassadorReferralPromoId)
    }

    // Increment promotional code usage count
    await Promise.allSettled(
      Array.from(promotionalCodeIds).map(async (promotionalCodeId) => {
        const { error: promoIncrementError } = await admin.rpc('increment_promo_code_usage', {
          promo_code_id: promotionalCodeId,
        })

        if (promoIncrementError) {
          console.error('Erreur incrémentation code promo:', promoIncrementError)
        }
      }),
    )

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

    const ticketEmailTasks = createdRegistrations.map(async ({ registration, ticket, participantName }) => {
      try {
        const qrCodeBase64 = await QRCode.toDataURL(registration.qr_code_token).then((url) => url.split(',')[1])
        const eventDateLabel = new Date(eventRow.date).toLocaleDateString('fr-FR', {
          dateStyle: 'full',
          timeZone: 'Europe/Paris',
        })

        await sendTicketEmail({
          to: registration.email ?? '',
          participantName: participantName || registration.email || '',
          eventTitle: eventRow.title,
          eventDate: eventDateLabel,
          eventLocation: eventRow.location,
          ticketName: ticket.name,
          startTime: formatWaveStartTime(registration.start_time),
          waveIndex: registration.wave_index,
          bibNumber: registration.bib_number,
          qrUrl: `data:image/png;base64,${qrCodeBase64}`,
          manageUrl: `${siteUrl}/account/tickets?ticket=${registration.id}`,
        })
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError)
        captureException(emailError as Error, {
          context: 'ticket_email_send',
          registrationId: registration.id,
          email: registration.email,
        })
      }
    })

    const receiptEmailTask = (async () => {
      try {
        if (!user.email) {
          return
        }

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

        // The receipt must add up to what was charged: list the flexible option on its own line.
        const flexibleCount = flexibleParticipantIndices.size
        const flexibleItems =
          flexibleCount > 0
            ? [
                {
                  description: 'Option billet flexible',
                  quantity: flexibleCount,
                  unitPrice: toMajor(FLEXIBLE_TICKET_FEE_CENTS),
                  total: toMajor(FLEXIBLE_TICKET_FEE_CENTS * flexibleCount),
                },
              ]
            : []
        const receiptItems = [...ticketItems, ...upsellItems, ...flexibleItems]
        const subtotalCents = ticketSubtotal + upsellSubtotal + FLEXIBLE_TICKET_FEE_CENTS * flexibleCount
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
          discountLabel:
            discountCents > 0
              ? normalizedPromoCodes.length > 0
                ? `Codes promo ${normalizedPromoCodes.join(', ')}`
                : 'Réduction'
              : undefined,
          total: toMajor(totalCents),
          currency: (paymentIntent.currency || 'eur').toUpperCase(),
          paymentMethod: formatPaymentMethod(paymentIntent.payment_method_types?.[0]),
          invoiceUrl: order.invoice_url ?? undefined,
        })
      } catch (emailError) {
        console.error('Erreur envoi reçu:', emailError)
        captureException(emailError as Error, {
          context: 'receipt_email_send',
          orderId: order.id,
          email: user.email,
        })
      }
    })()

    const pushNotificationTask = sendAdminPushNotification({
      title: 'Nouvelle inscription payée',
      body: details,
      url: `${siteUrl}/dashboard?tab=members&event=${eventRow.id}`,
    }).catch((pushError) => {
      console.error('[push] notification error', pushError)
    })

    const ambassadorRewardsTask = (async () => {
      const { error: ambassadorPointsError } = await admin.rpc('award_ambassador_points_for_order', {
        p_order_id: order.id,
      })

      if (ambassadorPointsError) {
        console.error('Erreur attribution points ambassadeur:', ambassadorPointsError)
        return
      }

      try {
        await notifyAmbassadorRewardsForOrder(admin, order.id)
      } catch (notificationError) {
        console.error('Erreur notification récompense ambassadeur:', notificationError)
      }
    })()

    const metaCapiTasks = [
      sendMetaCapiEvent({
        eventName: 'Purchase',
        eventId: `purchase_${order.id}`,
        eventSourceUrl:
          (typeof paymentIntent.metadata?.event_source_url === 'string' && paymentIntent.metadata.event_source_url) ||
          request.headers.get('referer') ||
          `${siteUrl}/events/${eventId}/register`,
        userData: {
          email: user.email,
          externalId: userId,
          clientIpAddress,
          clientUserAgent,
          fbp:
            (typeof paymentIntent.metadata?.fbp === 'string' && paymentIntent.metadata.fbp) ||
            fbpCookie,
          fbc:
            (typeof paymentIntent.metadata?.fbc === 'string' && paymentIntent.metadata.fbc) ||
            fbcCookie,
        },
        customData: {
          currency: (paymentIntent.currency || 'eur').toUpperCase(),
          value: Number(((paymentIntent.amount || 0) / 100).toFixed(2)),
          content_type: 'product',
          content_ids: createdRegistrations.map(({ ticket }) => String(ticket.id)),
          content_name: eventRow.title,
          order_id: order.id,
          event_id: eventId,
        },
      }),
      sendMetaCapiEvent({
        eventName: 'PaymentConfirmed',
        eventId: `payment_confirmed_${order.id}`,
        eventSourceUrl:
          (typeof paymentIntent.metadata?.event_source_url === 'string' && paymentIntent.metadata.event_source_url) ||
          request.headers.get('referer') ||
          `${siteUrl}/events/${eventId}/register`,
        userData: {
          email: user.email,
          externalId: userId,
          clientIpAddress,
          clientUserAgent,
          fbp:
            (typeof paymentIntent.metadata?.fbp === 'string' && paymentIntent.metadata.fbp) ||
            fbpCookie,
          fbc:
            (typeof paymentIntent.metadata?.fbc === 'string' && paymentIntent.metadata.fbc) ||
            fbcCookie,
        },
        customData: {
          transaction_id: order.id,
          currency: (paymentIntent.currency || 'eur').toUpperCase(),
          value: Number(((paymentIntent.amount || 0) / 100).toFixed(2)),
          event_id: eventId,
        },
      }),
    ]

    const resendSyncTask = (async () => {
      try {
        const seenEmails = new Set<string>()

        await Promise.allSettled(
          createdRegistrations.map(async ({ registration, participantName }) => {
            const email = String(registration.email ?? '').trim().toLowerCase()
            if (!email || seenEmails.has(email)) return
            seenEmails.add(email)

            await markResendContactAsRegistered({
              email,
              fullName: participantName ?? null,
              properties: {
                source: 'registration-create',
                event_id: eventId,
              },
            })
          }),
        )
      } catch (resendSyncError) {
        console.error('[registration-create] resend segment sync failed', resendSyncError)
      }
    })()

    await Promise.allSettled([
      ...ticketEmailTasks,
      receiptEmailTask,
      pushNotificationTask,
      ambassadorRewardsTask,
      ...metaCapiTasks,
      resendSyncTask,
    ])

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

  } catch (error) {
    console.error('Erreur création inscription:', error)

    // Capture error in Sentry with context
    if (error instanceof Error) {
      captureException(error, {
        route: '/api/registrations/create',
        method: 'POST',
      })
    }

    return NextResponse.json({
      error: 'Erreur lors de la création de l\'inscription',
      details: error instanceof Error ? error.message : String(error)
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
    case 'free':
      return 'Code promotionnel'
    default:
      return method ? method.toUpperCase() : 'Paiement'
  }
}
