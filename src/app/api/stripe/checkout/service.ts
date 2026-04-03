import { createSupabaseServer } from '@/lib/supabase/server'
import { stripeClient, respondJson } from '@/app/api/stripe/create-payment-intent/utils'
import { isEventOpenForRegistration } from '@/lib/events/registrationStatus'
import { sendMetaCapiEvent } from '@/lib/analytics/metaCapi'

interface CheckoutPayload {
  ticketId: string
  eventId: string
  userId: string
  userEmail: string
  participantName?: string
}

interface CheckoutTrackingContext {
  clientIpAddress?: string | null
  clientUserAgent?: string | null
  fbp?: string | null
  fbc?: string | null
  eventSourceUrl?: string | null
}

const ensureAvailability = async (supabase: Awaited<ReturnType<typeof createSupabaseServer>>, eventId: string) => {
  const { count: registrationCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)

  return registrationCount || 0
}

export const createCheckoutSession = async (
  payload: CheckoutPayload,
  trackingContext?: CheckoutTrackingContext,
) => {
  const { ticketId, eventId, userId, userEmail, participantName } = payload

  if (!ticketId || !eventId || !userId) {
    throw respondJson({ error: 'Paramètres manquants' }, 400)
  }

  const supabase = await createSupabaseServer()

  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select(
      `*,
      event:events (
        id,
        title,
        date,
        sales_start,
        location,
        status,
        capacity
      ),
      race:races!tickets_race_id_fkey (
        id,
        name,
        distance_km
      )
    `,
    )
    .eq('id', ticketId)
    .single()

  if (ticketError || !ticket) {
    throw respondJson({ error: 'Ticket introuvable' }, 404)
  }

  const existingRegistrations = await ensureAvailability(supabase, eventId)
  const availableSpots = (ticket.event.capacity || 0) - existingRegistrations

  if (availableSpots <= 0) {
    throw respondJson({ error: 'Événement complet' }, 409)
  }

  if (!isEventOpenForRegistration(ticket.event)) {
    throw respondJson({ error: 'Inscriptions fermées' }, 409)
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const fallbackEventUrl = `${base.replace(/\/$/, '')}/events/${eventId}`
  const eventSourceUrl = trackingContext?.eventSourceUrl ?? fallbackEventUrl

  const session = await stripeClient.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    payment_intent_data: {
      metadata: {
        user_id: userId,
        event_id: eventId,
        ticket_id: ticketId,
        participant_name: participantName || userEmail,
        participant_email: userEmail,
        event_title: ticket.event.title,
        ticket_name: ticket.name,
        race_id: ticket.race?.id || '',
        fbp: trackingContext?.fbp || '',
        fbc: trackingContext?.fbc || '',
        event_source_url: eventSourceUrl,
      },
    },
    line_items: [
      {
        price_data: {
          currency: ticket.currency,
          product_data: {
            name: `${ticket.event.title} - ${ticket.name}`,
            description:
              ticket.race
                ? `Course: ${ticket.race.name} (${ticket.race.distance_km}km)`
                : ticket.description || "Participation à l'événement",
          },
          unit_amount: ticket.base_price_cents ?? undefined,
        },
        quantity: 1,
      },
    ],
    customer_email: userEmail,
    success_url: `${base}/events/${eventId}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/events/${eventId}?canceled=1`,
    metadata: {
      user_id: userId,
      event_id: eventId,
      ticket_id: ticketId,
      participant_name: participantName || userEmail,
      participant_email: userEmail,
      event_title: ticket.event.title,
      ticket_name: ticket.name,
      race_id: ticket.race?.id || '',
      fbp: trackingContext?.fbp || '',
      fbc: trackingContext?.fbc || '',
      event_source_url: eventSourceUrl,
    },
  })

  const eventIdForMeta = `initiate_checkout_${session.id}`
  const value = Number(((ticket.base_price_cents ?? 0) / 100).toFixed(2))
  await sendMetaCapiEvent({
    eventName: 'InitiateCheckout',
    eventId: eventIdForMeta,
    eventSourceUrl,
    userData: {
      email: userEmail,
      externalId: userId,
      clientIpAddress: trackingContext?.clientIpAddress ?? null,
      clientUserAgent: trackingContext?.clientUserAgent ?? null,
      fbp: trackingContext?.fbp ?? null,
      fbc: trackingContext?.fbc ?? null,
    },
    customData: {
      currency: ticket.currency?.toUpperCase() || 'EUR',
      value,
      content_name: `${ticket.event.title} - ${ticket.name}`,
      content_ids: [ticketId],
      content_type: 'product',
      event_id: eventId,
      ticket_id: ticketId,
    },
  })

  return { url: session.url }
}
