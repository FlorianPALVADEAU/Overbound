import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/server'
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
import { isEventOpenForRegistration } from '@/lib/events/registrationStatus'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let eventId: string | undefined
  let userId: string | undefined
  let ticketSelections: any[] = []
  let participants: any[] = []
  let promoCode: string | null = null
  let ambassadorReferralCode: string | null = null

  try {
    const requestBody = await request.json()
    eventId = requestBody.eventId
    userId = requestBody.userId
    const userEmail = requestBody.userEmail
    ticketSelections = requestBody.ticketSelections || []
    participants = requestBody.participants || []
    const upsells = requestBody.upsells || []
    promoCode = requestBody.promoCode || null
    ambassadorReferralCode = requestBody.ambassadorReferralCode || null
    if (typeof promoCode === 'string') {
      promoCode = promoCode.trim().toUpperCase()
      if (promoCode.length === 0) {
        promoCode = null
      }
    }
    if (typeof ambassadorReferralCode === 'string') {
      ambassadorReferralCode = ambassadorReferralCode.trim().toUpperCase()
      if (ambassadorReferralCode.length === 0) {
        ambassadorReferralCode = null
      }
    }

    if (promoCode && /[,;|]/.test(promoCode)) {
      return respondJson({ error: 'Un seul code promotionnel est autorise par commande.' }, 400)
    }
    if (ambassadorReferralCode && /[,;|]/.test(ambassadorReferralCode)) {
      return respondJson({ error: 'Un seul code ambassadeur est autorise par commande.' }, 400)
    }

    if (!eventId || !userId || !userEmail || ticketSelections.length === 0) {
      return respondJson({ error: 'Paramètres insuffisants.' }, 400)
    }

    const supabase = await createSupabaseServer()
    const admin = supabaseAdmin()
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

    if (!isEventOpenForRegistration(eventRef)) {
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
    let hasTierDiscountApplied = false

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

      if (tier && tier.discount_percentage > 0) {
        hasTierDiscountApplied = true
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
    let validatedAmbassadorReferralCode: string | null = null

    if (promoCode) {
      const { data: promo, error: promoError } = await fetchPromo(supabase, promoCode)
      if (!promoError && promo) {
        const promoData = calcPromo(promo, ticketSubtotal)
        discountAmount = promoData.discountAmount
        if (promoData.appliedPromo) {
          const { data: ambassadorRow } = await admin
            .from('ambassadors')
            .select('id')
            .eq('promotional_code_id', promo.id)
            .limit(1)
            .maybeSingle()

          appliedPromo = {
            ...promoData.appliedPromo,
            is_ambassador: Boolean(ambassadorRow?.id),
          }
        } else {
          appliedPromo = null
        }
      }
    }

    // Keep only the best discount: ambassador promo is tracked but not stacked with active tier discount.
    if (appliedPromo?.is_ambassador && hasTierDiscountApplied) {
      discountAmount = 0
      appliedPromo = null
    }

    if (ambassadorReferralCode) {
      const { data: ambassadorPromo, error: ambassadorPromoError } = await fetchPromo(supabase, ambassadorReferralCode)
      if (!ambassadorPromoError && ambassadorPromo) {
        const now = new Date()
        const validFrom = ambassadorPromo.valid_from ? new Date(ambassadorPromo.valid_from) : null
        const validUntil = ambassadorPromo.valid_until ? new Date(ambassadorPromo.valid_until) : null
        const allowedEvents = (ambassadorPromo.events || []).map((item: { event_id: string }) => item.event_id)
        const matchesEvent = allowedEvents.length === 0 || allowedEvents.includes(eventId)
        const withinDates = (!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)
        const usageAvailable =
          ambassadorPromo.usage_limit == null || ambassadorPromo.used_count < ambassadorPromo.usage_limit
        const { data: ambassadorRow } = await admin
          .from('ambassadors')
          .select('id')
          .eq('promotional_code_id', ambassadorPromo.id)
          .limit(1)
          .maybeSingle()
        const isAmbassadorCode = Boolean(ambassadorRow?.id)

        if (ambassadorPromo.is_active && matchesEvent && withinDates && usageAvailable && isAmbassadorCode) {
          validatedAmbassadorReferralCode = ambassadorPromo.code
        }
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
        registration_flow: 'multi',
        user_id: userId,
        event_id: eventId,
        promo_code: appliedPromo?.code || '',
        ambassador_referral_code:
          validatedAmbassadorReferralCode && validatedAmbassadorReferralCode !== appliedPromo?.code
            ? validatedAmbassadorReferralCode
            : '',
        discount_applied: discountAmount.toString(),
        tier_allocations: JSON.stringify(tierAllocationsPayload),
        event_title: eventRef.title,
        ticket_count: String(ticketSelections.length),
        participant_count: String(participantEntries.length),
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
      ambassadorReferralCode,
    })

    return respondJson({ error: 'Erreur lors de la préparation du paiement.' }, 500)
  }
}
