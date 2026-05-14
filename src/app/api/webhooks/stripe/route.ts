import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { sendReceiptEmail, sendTicketEmail } from '@/lib/email'
import { notifyDocumentRequired } from '@/lib/email/documents'
import { notifyAmbassadorRewardsForOrder } from '@/lib/ambassadors/rewardsNotifications'
import { sendAdminPushNotification } from '@/lib/push'
import { generateAndUploadQRCode } from '@/lib/qrcode/upload'
import { sendMetaCapiEvent } from '@/lib/analytics/metaCapi'
import { markResendContactAsRegistered } from '@/lib/email/resendAudiences'
import {
  assignOpenWaveToRegistration,
  formatWaveStartTime,
  getRankedStartTime,
  isOpenFormatTicket,
  isRankedFormatTicket,
} from '@/lib/openSas'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound-race.com'

const hasAmbassadorLink = (value: unknown) => {
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value && typeof value === 'object')
}

const isPpsOnlyAndTooEarly = (eventDate: string | null | undefined, documentTypes: string[] | null | undefined) => {
  if (!eventDate || !documentTypes || documentTypes.length === 0) return false
  const isPpsOnly = documentTypes.every((type) => String(type || '').toLowerCase().includes('pps'))
  if (!isPpsOnly) return false
  const earliestAllowed = new Date(eventDate)
  earliestAllowed.setMonth(earliestAllowed.getMonth() - 3)
  return Date.now() < earliestAllowed.getTime()
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature') as string
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response(`Webhook Error: ${err}`, { status: 400 })
  }

  const admin = supabaseAdmin()

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      let metadata = paymentIntent.metadata || {}
      let sessionCustomerEmail: string | null = null

      if (
        (!metadata.user_id || !metadata.event_id || !metadata.ticket_id) &&
        !metadata.ticket_selections
      ) {
        try {
          const sessions = await stripe.checkout.sessions.list({
            payment_intent: paymentIntent.id,
            limit: 1,
          })

          const session = sessions.data[0]
          if (session) {
            sessionCustomerEmail =
              session.customer_email || session.customer_details?.email || null
            metadata = { ...session.metadata, ...metadata }
          }
        } catch (sessionError) {
          console.warn('Unable to fetch Checkout Session for PaymentIntent:', paymentIntent.id, sessionError)
        }
      }

      const {
        registration_flow,
        user_id,
        event_id,
        ticket_id,
        participant_email,
        promo_code,
        ambassador_referral_code,
        event_title,
        ticket_name,
        race_id,
        upsells: upsellsJson,
        distance_ideal_km,
        distance_min_km,
        participants: participantsJson,
      } = metadata

      if (registration_flow === 'multi') {
        console.error('Webhook skip (multi flow): paid PaymentIntent requires manual registration check', {
          payment_intent_id: paymentIntent.id,
          user_id,
          event_id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        })
        try {
          await sendAdminPushNotification({
            title: 'Paiement OK sans inscription (multi)',
            body: `${paymentIntent.id} • ${paymentIntent.amount / 100} ${(paymentIntent.currency || 'eur').toUpperCase()}`,
            url: `${siteUrl}/dashboard?tab=members${event_id ? `&event=${event_id}` : ''}`,
          })
        } catch (pushError) {
          console.error('[push] multi-flow warning notification error', pushError)
        }
        return new Response('ok', { status: 200 })
      }

      if (!user_id || !event_id || !ticket_id) {
        console.error('Métadonnées manquantes dans le PaymentIntent:', metadata)
        return new Response('Métadonnées manquantes', { status: 400 })
      }

      try {
        // Check if registration already exists
        const { data: existingReg } = await admin
          .from('registrations')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (existingReg) {
          console.log('Registration already exists for PaymentIntent:', paymentIntent.id)
          return new Response('ok', { status: 200 })
        }

        // Parse upsells
        let upsells = []
        try {
          upsells = upsellsJson ? JSON.parse(upsellsJson) : []
        } catch (e) {
          console.warn('Could not parse upsells JSON:', upsellsJson)
        }

        let participantDistances: { distanceIdealKm?: number; distanceMinKm?: number } = {}
        if ((!distance_ideal_km || !distance_min_km) && participantsJson) {
          try {
            const parsed = JSON.parse(participantsJson)
            if (Array.isArray(parsed) && parsed[0]) {
              const first = parsed[0]
              const ideal = Number(first.distanceIdealKm)
              const min = Number(first.distanceMinKm)
              participantDistances = {
                distanceIdealKm: Number.isFinite(ideal) ? ideal : undefined,
                distanceMinKm: Number.isFinite(min) ? min : undefined,
              }
            }
          } catch (e) {
            console.warn('Could not parse participants JSON:', participantsJson)
          }
        }

        const parseDistance = (value: unknown) => {
          const parsed = Number(value)
          return Number.isFinite(parsed) ? parsed : null
        }

        // Generate unique tokens
        const qrToken = uuidv4()
        const transferToken = uuidv4()

        // Get full event details
        const { data: event, error: eventError } = await admin
          .from('events')
          .select('*')
          .eq('id', event_id)
          .single()

        if (eventError || !event) {
          console.error('Event not found:', event_id, eventError)
          return new Response('Event not found', { status: 404 })
        }

        // Get ticket details
        const { data: ticket, error: ticketError } = await admin
          .from('tickets')
          .select('*')
          .eq('id', ticket_id)
          .single()

        if (ticketError || !ticket) {
          console.error('Ticket not found:', ticket_id, ticketError)
          return new Response('Ticket not found', { status: 404 })
        }

        let latestCharge: Stripe.Charge | null = null
        try {
          if (typeof paymentIntent.latest_charge === 'string') {
            latestCharge = await stripe.charges.retrieve(paymentIntent.latest_charge)
          } else if (paymentIntent.latest_charge && typeof paymentIntent.latest_charge === 'object') {
            latestCharge = paymentIntent.latest_charge
          }
        } catch (chargeError) {
          console.warn('Unable to retrieve latest charge for PaymentIntent:', paymentIntent.id, chargeError)
        }

        const resolvedParticipantEmail =
          participant_email ||
          sessionCustomerEmail ||
          paymentIntent.receipt_email ||
          latestCharge?.billing_details?.email ||
          ''

        if (!resolvedParticipantEmail) {
          console.error('Email participant introuvable pour PaymentIntent:', paymentIntent.id)
          return new Response('Email participant manquant', { status: 400 })
        }

        let promotionalCodeId: string | null = null
        if (typeof promo_code === 'string' && promo_code.trim().length > 0) {
          const { data: promoRow, error: promoError } = await admin
            .from('promotional_codes')
            .select('id')
            .ilike('code', promo_code.trim().toUpperCase())
            .maybeSingle()

          if (promoError) {
            console.error('Error finding promotional code:', promoError)
          } else {
            promotionalCodeId = promoRow?.id ?? null
          }
        }

        let ambassadorReferralPromoId: string | null = null
        if (typeof ambassador_referral_code === 'string' && ambassador_referral_code.trim().length > 0) {
          const { data: ambassadorPromoRow, error: ambassadorPromoError } = await admin
            .from('promotional_codes')
            .select('id, ambassadors:ambassadors(id)')
            .ilike('code', ambassador_referral_code.trim().toUpperCase())
            .maybeSingle()

          if (ambassadorPromoError) {
            console.error('Error finding ambassador referral code:', ambassadorPromoError)
          } else {
            const isAmbassadorCode = hasAmbassadorLink((ambassadorPromoRow as any)?.ambassadors)
            ambassadorReferralPromoId = isAmbassadorCode ? ambassadorPromoRow?.id ?? null : null
          }
        }

        const registrationPromotionalCodeId = ambassadorReferralPromoId ?? promotionalCodeId

        // Create order
        const { data: order, error: orderError } = await admin
          .from('orders')
          .insert({
            user_id,
            email: resolvedParticipantEmail,
            status: 'paid',
            amount_total: paymentIntent.amount,
            currency: paymentIntent.currency,
            provider: 'stripe',
            provider_order_id: paymentIntent.id,
          })
          .select()
          .single()

        if (orderError) {
          console.error('Error creating order:', orderError)
          throw orderError
        }

        const participantName =
          (metadata.participant_name as string | undefined) || resolvedParticipantEmail

        const isOpenFormat = isOpenFormatTicket(ticket.name, ticket.race?.name ?? null)
        const isRankedFormat = isRankedFormatTicket(ticket.name, ticket.race?.name ?? null)
        const idealDistance = parseDistance(distance_ideal_km) ?? participantDistances.distanceIdealKm ?? null
        const minDistance = parseDistance(distance_min_km) ?? participantDistances.distanceMinKm ?? null

        // Create registration
        const { data: registration, error: registrationError } = await admin
          .from('registrations')
          .insert({
            user_id,
            event_id,
            ticket_id,
            order_id: order.id,
            email: resolvedParticipantEmail,
            qr_code_token: qrToken,
            transfer_token: transferToken,
            stripe_payment_intent_id: paymentIntent.id,
            approval_status: 'pending',
            race_id: race_id || null,
            promotional_code_id: registrationPromotionalCodeId,
            // DB constraints require non-null positive distances; for non-OPEN formats
            // we store a neutral placeholder and skip OPEN SAS logic.
            distance_ideal_km: isOpenFormat ? idealDistance : 1,
            distance_min_km: isOpenFormat ? minDistance : 1,
          })
          .select()
          .single()

        if (registrationError) {
          console.error('Error creating registration:', registrationError)
          throw registrationError
        }

        if (event?.date) {
          try {
            if (isOpenFormat) {
              const assignment = await assignOpenWaveToRegistration({
                admin,
                eventId: event_id,
                registrationId: registration.id,
                eventDateIso: event.date,
                ticketName: ticket.name,
                raceName: ticket.race?.name ?? null,
                distanceIdealKm: idealDistance,
                distanceMinKm: minDistance,
              })

              if (assignment) {
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
            } else if (isRankedFormat) {
              const rankedStart = getRankedStartTime(event.date).toISOString()
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
        }

        if (promotionalCodeId) {
          const { error: promoIncrementError } = await admin.rpc('increment_promo_code_usage', {
            promo_code_id: promotionalCodeId,
          })

          if (promoIncrementError) {
            console.error('Error incrementing promotional code usage:', promoIncrementError)
          }
        }

        const { error: ambassadorPointsError } = await admin.rpc('award_ambassador_points_for_order', {
          p_order_id: order.id,
        })
        if (ambassadorPointsError) {
          console.error('Error awarding ambassador points:', ambassadorPointsError)
        } else {
          try {
            await notifyAmbassadorRewardsForOrder(admin, order.id)
          } catch (notificationError) {
            console.error('Error sending ambassador reward notification:', notificationError)
          }
        }

        // Create upsell records
        if (upsells && upsells.length > 0) {
          const upsellRecords = upsells
            .map((upsell: any) => {
              const quantity = Number(upsell.quantity || 0)
              if (!upsell.name || !Number.isFinite(quantity) || quantity <= 0) return null
              return {
                registration_id: registration.id,
                name: upsell.name,
                price_cents: upsell.price || 0,
                quantity,
                currency: paymentIntent.currency,
                meta: upsell.meta ?? null,
              }
            })
            .filter(Boolean)

          if (upsellRecords.length > 0) {
            const { error: upsellError } = await admin
              .from('registration_upsells')
              .insert(upsellRecords)

            if (upsellError) {
              if ((upsellError as any)?.code === 'PGRST205') {
                console.warn('registration_upsells table missing, skipping upsell persistence.')
              } else {
                console.error('Error creating upsells:', upsellError)
              }
            }
          }
        }

        console.log('Registration created successfully via webhook:', {
          registration_id: registration.id,
          order_id: order.id,
          user_id,
          event_id,
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount
        })

        await sendMetaCapiEvent({
          eventName: 'Purchase',
          eventId: `purchase_${order.id}`,
          eventSourceUrl:
            typeof metadata.event_source_url === 'string' && metadata.event_source_url
              ? metadata.event_source_url
              : `${siteUrl}/events/${event.slug ?? event_id}`,
          userData: {
            email: resolvedParticipantEmail,
            externalId: String(user_id),
            fbp: typeof metadata.fbp === 'string' ? metadata.fbp : null,
            fbc: typeof metadata.fbc === 'string' ? metadata.fbc : null,
          },
          customData: {
            currency: (paymentIntent.currency || 'eur').toUpperCase(),
            value: Number(((paymentIntent.amount || 0) / 100).toFixed(2)),
            content_ids: [String(ticket_id)],
            content_type: 'product',
            content_name: `${event_title || event.title} - ${ticket_name || ticket.name}`,
            order_id: order.id,
            event_id: String(event_id),
            ticket_id: String(ticket_id),
          },
        })
        await sendMetaCapiEvent({
          eventName: 'PaymentConfirmed',
          eventId: `payment_confirmed_${order.id}`,
          eventSourceUrl:
            typeof metadata.event_source_url === 'string' && metadata.event_source_url
              ? metadata.event_source_url
              : `${siteUrl}/events/${event.slug ?? event_id}`,
          userData: {
            email: resolvedParticipantEmail,
            externalId: String(user_id),
            fbp: typeof metadata.fbp === 'string' ? metadata.fbp : null,
            fbc: typeof metadata.fbc === 'string' ? metadata.fbc : null,
          },
          customData: {
            transaction_id: order.id,
            currency: (paymentIntent.currency || 'eur').toUpperCase(),
            value: Number(((paymentIntent.amount || 0) / 100).toFixed(2)),
            event_id: String(event_id),
          },
        })

        if (ticket.requires_document) {
          try {
            const eventDate = event?.date ?? null
            const tooEarlyForPpsOnly = isPpsOnlyAndTooEarly(eventDate, ticket.document_types ?? [])
            if (!tooEarlyForPpsOnly) {
              await notifyDocumentRequired({
                registrationId: registration.id,
                userId: registration.user_id,
                participantName,
                eventTitle: event_title || event.title,
                email: registration.email,
                requiredDocuments: ticket.document_types ?? [],
              })
            }
          } catch (documentEmailError) {
            console.error('Error sending document required email:', documentEmailError)
          }
        }

        try {
          let eventTitle: string | null = null
          if (event_id) {
            const { data: eventRow } = await admin
              .from('events')
              .select('title')
              .eq('id', event_id)
              .maybeSingle()
            eventTitle = eventRow?.title ?? null
          }

          const currency = (paymentIntent.currency || 'eur').toUpperCase()
          const amountValue = typeof paymentIntent.amount === 'number' ? paymentIntent.amount / 100 : null
          const amountLabel = amountValue !== null
            ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amountValue)
            : null

          const details = [
            participantName || resolvedParticipantEmail,
            eventTitle,
            amountLabel,
          ].filter(Boolean).join(' • ')

          await sendAdminPushNotification({
            title: 'Nouvelle inscription payée',
            body: details,
            url: `${siteUrl}/dashboard?tab=members${event_id ? `&event=${event_id}` : ''}`,
          })
        } catch (pushError) {
          console.error('[push] notification error', pushError)
        }

        // Send confirmation email
        try {
          const eventDateLabel = new Date(event.date).toLocaleDateString('fr-FR', {
            dateStyle: 'full',
            timeZone: 'Europe/Paris',
          })

          // Generate QR code and upload to Supabase Storage
          const qrUrl = await generateAndUploadQRCode(qrToken)

          await sendTicketEmail({
            to: registration.email,
            participantName,
            eventTitle: event_title || event.title,
            eventDate: eventDateLabel,
            eventLocation: event.location,
            ticketName: ticket_name || ticket.name,
            startTime: formatWaveStartTime(registration.start_time),
            qrUrl, // Public URL from Supabase Storage
            manageUrl: `${siteUrl}/account/tickets?ticket=${registration.id}`
          })

          console.log('Confirmation email sent to:', registration.email)
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError)
        }

        try {
          await markResendContactAsRegistered({
            email: registration.email,
            fullName: participantName ?? null,
            properties: {
              source: 'stripe-webhook-registration',
              event_id: String(event_id),
            },
          })
        } catch (resendSyncError) {
          console.error('[stripe webhook] resend segment sync failed', resendSyncError)
        }

        // Send receipt email
        try {
          const receiptEmail =
            registration.email ||
            participant_email ||
            paymentIntent.receipt_email ||
            latestCharge?.billing_details?.email

          if (receiptEmail) {
            const upsellItems = (upsells || [])
              .map((upsell: any) => {
                const quantity = upsell.quantity || 1
                const unitPriceCents = upsell.price || 0
                if (!upsell.name || unitPriceCents <= 0) return null

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

            const upsellTotalCents = (upsells || []).reduce((sum: number, upsell: any) => {
              const quantity = upsell.quantity || 1
              const unitPriceCents = upsell.price || 0
              return sum + unitPriceCents * quantity
            }, 0)

            const amountTotalCents = paymentIntent.amount ?? 0
            const ticketPriceCents =
              ticket.base_price_cents ??
              Math.max(amountTotalCents - upsellTotalCents, 0)

            const ticketItem = {
              description: `${event_title || event.title} — ${ticket_name || ticket.name}`,
              quantity: 1,
              unitPrice: toMajor(ticketPriceCents),
              total: toMajor(ticketPriceCents),
            }

            const subtotalCents = ticketPriceCents + upsellTotalCents
            const discountCents = Math.max(subtotalCents - amountTotalCents, 0)

            await sendReceiptEmail({
              to: receiptEmail,
              fullName: participantName || null,
              invoiceNumber: order.id,
              invoiceDate: new Date(order.created_at ?? Date.now()).toLocaleDateString('fr-FR', { dateStyle: 'full' }),
              eventName: event_title || event.title,
              items: [ticketItem, ...upsellItems],
              subtotal: toMajor(subtotalCents),
              discount: discountCents > 0 ? toMajor(discountCents) : undefined,
              total: toMajor(amountTotalCents || subtotalCents),
              currency: (paymentIntent.currency || ticket.currency || 'eur').toUpperCase(),
              paymentMethod: formatPaymentMethod(paymentIntent.payment_method_types?.[0]),
              invoiceUrl: order.invoice_url ?? undefined,
            })
          }
        } catch (receiptError) {
          console.error('Error sending receipt email:', receiptError)
        }

      } catch (error) {
        console.error('Error processing payment_intent.succeeded:', error)
        return new Response('Error processing registration', { status: 500 })
      }
      break
    }
    
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message)
      
      // Optionally, you could store failed payment attempts for analytics
      // or send notification emails to users about payment failures
      break
    }

    case 'payment_intent.canceled': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('Payment canceled:', paymentIntent.id)
      break
    }

    default:
      console.log(`Unhandled Stripe event type: ${event.type}`)
      break
  }

  return new Response('ok', { status: 200 })
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
