import { createSupabaseServer } from '@/lib/supabase/server'
import { stripeClient, respondJson } from '@/app/api/stripe/create-payment-intent/utils'

interface CheckoutPayload {
  ticketId: string
  eventId: string
  userId: string
  userEmail: string
  participantName?: string
}

const ensureAvailability = async (supabase: Awaited<ReturnType<typeof createSupabaseServer>>, eventId: string) => {
  const { count: registrationCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)

  return registrationCount || 0
}

export const createCheckoutSession = async (payload: CheckoutPayload) => {
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

  if (ticket.event.status !== 'on_sale') {
    throw respondJson({ error: 'Inscriptions fermées' }, 409)
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const session = await stripeClient.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
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
      race_id: ticket.race?.id || '',
    },
  })

  return { url: session.url }
}
