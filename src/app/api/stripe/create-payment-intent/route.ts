import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import {
  stripeClient,
  fetchTicketsForSelections,
  fetchUpsellsForEvent,
  fetchPromo,
  getTicketSubtotal,
  getUpsellSubtotal,
  calcPromo,
  ensureAvailability,
  respondJson,
} from './utils'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const {
      eventId,
      userId,
      userEmail,
      ticketSelections = [],
      participants = [],
      upsells = [],
      promoCode = null,
    } = await request.json()

    if (!eventId || !userId || !userEmail || ticketSelections.length === 0) {
      return respondJson({ error: 'Paramètres insuffisants.' }, 400)
    }

    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return respondJson({ error: 'Non authentifié.' }, 401)
    }

    const ticketIds = ticketSelections.map((item: any) => item.ticketId)
    const { data: tickets, error: ticketsError } = await fetchTicketsForSelections(supabase, ticketIds)

    if (ticketsError || !tickets || tickets.length === 0) {
      return respondJson({ error: 'Impossible de récupérer les billets.' }, 404)
    }

    const eventRef = tickets[0]?.event
    if (!eventRef || eventRef.id !== eventId) {
      return respondJson({ error: "Les billets ne correspondent pas à l'événement demandé." }, 400)
    }

    if (eventRef.status !== 'on_sale') {
      return respondJson({ error: 'Inscriptions fermées pour cet événement.' }, 409)
    }

    const totalRequestedParticipants = ticketSelections.reduce(
      (accumulator: number, item: { quantity: number }) => accumulator + (item.quantity || 0),
      0,
    )

    const existingRegistrationsCount = await ensureAvailability(supabase, eventId, totalRequestedParticipants)
    const availableSpots = (eventRef.capacity || 0) - existingRegistrationsCount

    if (availableSpots <= 0 || totalRequestedParticipants > availableSpots) {
      return respondJson({ error: "Plus assez de places disponibles pour l'ensemble des participants." }, 409)
    }

    const ticketPriceMap = new Map<string, number>()
    const ticketCurrencyMap = new Map<string, string>()

    for (const ticket of tickets) {
      if (ticket.base_price_cents == null) {
        return respondJson({ error: `Le billet "${ticket.name}" n'a pas de tarif défini.` }, 422)
      }
      ticketPriceMap.set(ticket.id, ticket.base_price_cents)
      ticketCurrencyMap.set(ticket.id, (ticket.currency || 'eur').toLowerCase())
    }

    const ticketSubtotal = getTicketSubtotal(ticketSelections, ticketPriceMap)

    const { data: upsellRows } = await fetchUpsellsForEvent(supabase, eventId)
    const upsellMap = new Map<string, any>()
    for (const row of upsellRows || []) {
      upsellMap.set(row.id, row)
    }

    const upsellSubtotal = getUpsellSubtotal(upsells, upsellMap)

    let discountAmount = 0
    let appliedPromo = null

    if (promoCode) {
      const { data: promo, error: promoError } = await fetchPromo(supabase, promoCode)
      if (!promoError && promo) {
        const promoData = calcPromo(promo, ticketSubtotal)
        discountAmount = promoData.discountAmount
        appliedPromo = promoData.appliedPromo
      }
    }

    const totalAmount = Math.max(ticketSubtotal + upsellSubtotal - discountAmount, 0)

    if (totalAmount <= 0) {
      return respondJson({ error: 'Montant total invalide.' }, 422)
    }

    const currency = ticketCurrencyMap.values().next().value || 'eur'

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: totalAmount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: userId,
        event_id: eventId,
        ticket_selections: JSON.stringify(ticketSelections),
        participants: JSON.stringify(participants),
        upsells: JSON.stringify(upsells),
        promo_code: appliedPromo?.code || '',
        discount_applied: discountAmount.toString(),
        event_title: eventRef.title,
      },
      receipt_email: userEmail,
      description: `${eventRef.title} - Billets et options`,
    })

    return respondJson({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      pricing: {
        ticketTotal: ticketSubtotal,
        upsellTotal: upsellSubtotal,
        discountAmount,
        totalDue: totalAmount,
        currency,
      },
      appliedPromo,
    })
  } catch (error) {
    console.error('Erreur création PaymentIntent:', error)
    return respondJson({ error: 'Erreur lors de la préparation du paiement.' }, 500)
  }
}
