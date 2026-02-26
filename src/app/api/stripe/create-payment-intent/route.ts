import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import {
  stripeClient,
  fetchTicketsForSelections,
  fetchUpsellsForEvent,
  fetchPromo,
  getUpsellSubtotal,
  calcPromo,
  ensureAvailability,
  respondJson,
  allocateParticipantsToTiers,
  expandTierAllocations,
  fetchTierRegistrationCounts,
} from './utils'
import { captureException } from '@/lib/sentry'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let eventId: string | undefined
  let userId: string | undefined
  let ticketSelections: any[] = []
  let participants: any[] = []
  let promoCode: string | null = null

  try {
    const requestBody = await request.json()
    eventId = requestBody.eventId
    userId = requestBody.userId
    const userEmail = requestBody.userEmail
    ticketSelections = requestBody.ticketSelections || []
    participants = requestBody.participants || []
    const upsells = requestBody.upsells || []
    promoCode = requestBody.promoCode || null
    if (typeof promoCode === 'string') {
      promoCode = promoCode.trim().toUpperCase()
      if (promoCode.length === 0) {
        promoCode = null
      }
    }

    if (promoCode && /[,;|]/.test(promoCode)) {
      return respondJson({ error: 'Un seul code promotionnel est autorise par commande.' }, 400)
    }

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

    // if (eventRef.status !== 'on_sale') {
    //   return respondJson({ error: 'Inscriptions fermées pour cet événement.' }, 409)
    // }

    const totalRequestedParticipants = ticketSelections.reduce(
      (accumulator: number, item: { quantity: number }) => accumulator + (item.quantity || 0),
      0,
    )

    const existingRegistrationsCount = await ensureAvailability(supabase, eventId, totalRequestedParticipants)
    const availableSpots = (eventRef.capacity || 0) - existingRegistrationsCount

    if (availableSpots <= 0 || totalRequestedParticipants > availableSpots) {
      return respondJson({ error: "Plus assez de places disponibles pour l'ensemble des participants." }, 409)
    }

    const ticketById = new Map<string, (typeof tickets)[number]>()
    const ticketCurrencyMap = new Map<string, string>()
    for (const ticket of tickets) {
      ticketById.set(ticket.id, ticket)
      ticketCurrencyMap.set(ticket.id, (ticket.currency || 'eur').toLowerCase())
    }

    if (participants.length > 0 && participants.length !== totalRequestedParticipants) {
      return respondJson({ error: 'Le nombre de participants ne correspond pas aux billets sélectionnés.' }, 422)
    }

    const participantEntries =
      participants.length > 0
        ? participants.map((participant) => ({ ticketId: participant.ticketId }))
        : ticketSelections.flatMap((item) =>
            Array.from({ length: item.quantity || 0 }, () => ({ ticketId: item.ticketId })),
          )

    const tierCounts = await fetchTierRegistrationCounts(supabase, eventId)
    const { allocations, remaining, activeTierIndex } = allocateParticipantsToTiers(
      eventRef.price_tiers,
      tierCounts,
      participantEntries.length,
    )

    if (activeTierIndex !== null && remaining > 0) {
      return respondJson({ error: 'Tous les paliers de prix sont complets pour cet événement.' }, 409)
    }

    const tierIdsByParticipant =
      activeTierIndex !== null ? expandTierAllocations(allocations) : []

    let ticketSubtotal = 0

    for (const [index, entry] of participantEntries.entries()) {
      const ticket = ticketById.get(entry.ticketId)
      if (!ticket) {
        continue
      }

      const tierId = tierIdsByParticipant[index] ?? null
      const tier =
        tierId && eventRef.price_tiers
          ? eventRef.price_tiers.find(
              (tierItem: { id: string; discount_percentage: number }) => tierItem.id === tierId,
            )
          : null

      const finalPrice = ticket.final_price_cents
      if (finalPrice == null || finalPrice === 0) {
        return respondJson({ error: `Le billet "${ticket.name}" n'a pas de tarif défini.` }, 422)
      }

      const discountMultiplier = tier ? 1 - tier.discount_percentage / 100 : 1
      const unitPrice = Math.round(finalPrice * discountMultiplier)
      ticketSubtotal += unitPrice
    }

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

    const tierAllocationsPayload =
      activeTierIndex !== null
        ? allocations.map(({ tier, quantity }) => ({ tier_id: tier.id, quantity }))
        : []

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
        tier_allocations: JSON.stringify(tierAllocationsPayload),
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

    // Capture error in Sentry with context
    captureException(error as Error, {
      route: '/api/stripe/create-payment-intent',
      method: 'POST',
      eventId,
      userId,
      ticketCount: ticketSelections?.length || 0,
      participantCount: participants?.length || 0,
      promoCode,
    })

    return respondJson({ error: 'Erreur lors de la préparation du paiement.' }, 500)
  }
}
