import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import {
  stripeClient,
  fetchTicketsForSelections,
  fetchUpsellsForEvent,
  fetchPromo,
  getUpsellSubtotal,
  ensureAvailability,
  respondJson,
  allocateParticipantsToTiers,
  expandTierAllocations,
  fetchTierRegistrationCounts,
} from './utils'
import { captureException } from '@/lib/sentry'
import { isEventOpenForRegistration } from '@/lib/events/registrationStatus'
import { sendMetaCapiEvent } from '@/lib/analytics/metaCapi'

export const runtime = 'nodejs'

const MAX_PROMO_CODES = 2

const normalizePromoCode = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toUpperCase()
  return normalized.length > 0 ? normalized : null
}

const isPromoValidForEvent = (promo: any, eventId: string) => {
  const now = new Date()
  const validFrom = promo.valid_from ? new Date(promo.valid_from) : null
  const validUntil = promo.valid_until ? new Date(promo.valid_until) : null
  const allowedEvents = (promo.events || []).map((item: { event_id: string }) => item.event_id)
  const matchesEvent = allowedEvents.length === 0 || allowedEvents.includes(eventId)
  const withinDates = (!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)
  const usageAvailable = promo.usage_limit == null || promo.used_count < promo.usage_limit
  return promo.is_active && matchesEvent && withinDates && usageAvailable
}

export async function POST(request: NextRequest) {
  let eventId: string | undefined
  let userId: string | undefined
  let ticketSelections: any[] = []
  let participants: any[] = []
  let promoCodes: string[] = []
  let ambassadorReferralCode: string | null = null

  try {
    const clientIpAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      null
    const clientUserAgent = request.headers.get('user-agent')
    const fbp = request.cookies.get('_fbp')?.value ?? null
    const fbc = request.cookies.get('_fbc')?.value ?? null

    const requestBody = await request.json()
    eventId = requestBody.eventId
    userId = requestBody.userId
    const userEmail = requestBody.userEmail
    ticketSelections = requestBody.ticketSelections || []
    participants = requestBody.participants || []
    const upsells = requestBody.upsells || []
    const legacyPromoCode = normalizePromoCode(requestBody.promoCode)
    const inputPromoCodes: string[] = Array.isArray(requestBody.promoCodes)
      ? requestBody.promoCodes
          .map((code: unknown) => normalizePromoCode(code))
          .filter((code: string | null): code is string => Boolean(code))
      : legacyPromoCode
        ? [legacyPromoCode]
        : []
    const inputAmbassadorReferralCode = normalizePromoCode(requestBody.ambassadorReferralCode)

    promoCodes = [...new Set(inputPromoCodes)]
    if (promoCodes.length > MAX_PROMO_CODES) {
      return respondJson({ error: 'Vous pouvez appliquer au maximum 2 codes promo.' }, 400)
    }
    if (promoCodes.some((code) => /[,;|]/.test(code))) {
      return respondJson({ error: 'Format de code promo invalide.' }, 400)
    }

    ambassadorReferralCode = inputAmbassadorReferralCode
    if (ambassadorReferralCode && /[,;|]/.test(ambassadorReferralCode)) {
      return respondJson({ error: 'Format de code ambassadeur invalide.' }, 400)
    }
    if (ambassadorReferralCode && !promoCodes.includes(ambassadorReferralCode) && promoCodes.length >= MAX_PROMO_CODES) {
      return respondJson({ error: 'Vous pouvez appliquer au maximum 2 codes promo.' }, 400)
    }
    if (ambassadorReferralCode && !promoCodes.includes(ambassadorReferralCode)) {
      promoCodes.push(ambassadorReferralCode)
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
    const appliedPromos: Array<{
      id: string
      code: string
      discount_percent: number | null
      discount_amount: number | null
      currency: string | null
      is_ambassador: boolean
    }> = []
    let validatedAmbassadorReferralCode: string | null = null
    let regularPromoCount = 0
    let ambassadorPromoCount = 0

    for (const promoCode of promoCodes) {
      const { data: promo, error: promoError } = await fetchPromo(supabase, promoCode)
      if (promoError || !promo || !isPromoValidForEvent(promo, eventId)) {
        return respondJson({ error: `Le code promo ${promoCode} est invalide ou expiré.` }, 409)
      }

      const isAmbassadorCode = Array.isArray(promo.ambassadors) && promo.ambassadors.length > 0
      if (isAmbassadorCode) {
        ambassadorPromoCount += 1
      } else {
        regularPromoCount += 1
      }

      if (regularPromoCount > 1) {
        return respondJson({ error: 'Un seul code promo standard peut être appliqué par commande.' }, 409)
      }
      if (ambassadorPromoCount > 1) {
        return respondJson({ error: 'Un seul code ambassadeur peut être appliqué par commande.' }, 409)
      }

      if (isAmbassadorCode) {
        validatedAmbassadorReferralCode = promo.code
      }

      let promoDiscountAmount = 0
      if (promo.discount_percent && promo.discount_percent > 0) {
        promoDiscountAmount = Math.round(ticketSubtotal * (promo.discount_percent / 100))
      } else if (promo.discount_amount && promo.discount_amount > 0) {
        promoDiscountAmount = promo.discount_amount
      }
      discountAmount += Math.max(0, Math.min(promoDiscountAmount, ticketSubtotal))

      appliedPromos.push({
        id: promo.id,
        code: promo.code,
        discount_percent: promo.discount_percent,
        discount_amount: promo.discount_amount,
        currency: promo.currency,
        is_ambassador: isAmbassadorCode,
      })
    }

    discountAmount = Math.min(discountAmount, ticketSubtotal)

    const totalAmount = Math.max(ticketSubtotal + upsellSubtotal - discountAmount, 0)

    if (totalAmount <= 0) {
      return respondJson({ error: 'Montant total invalide.' }, 422)
    }

    const currency = ticketCurrencyMap.values().next().value || 'eur'

    const tierAllocationsPayload =
      activeTierIndex !== null
        ? allocations.map(({ tier, quantity }) => ({ tier_id: tier.id, quantity }))
        : []

    const primaryPromo = appliedPromos.find((promo) => !promo.is_ambassador) ?? appliedPromos[0] ?? null
    const promoCodesMetadata = appliedPromos.map((promo) => promo.code).join(',')

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: totalAmount,
      currency,
      payment_method_types: ['card', 'link'],
      metadata: {
        registration_flow: 'multi',
        user_id: userId,
        event_id: eventId,
        promo_code: primaryPromo?.code || '',
        promo_codes: promoCodesMetadata,
        ambassador_referral_code: validatedAmbassadorReferralCode || '',
        discount_applied: discountAmount.toString(),
        tier_allocations: JSON.stringify(tierAllocationsPayload),
        event_title: eventRef.title,
        ticket_count: String(ticketSelections.length),
        participant_count: String(participantEntries.length),
        fbp: fbp || '',
        fbc: fbc || '',
        event_source_url:
          request.headers.get('referer') ??
          request.headers.get('origin') ??
          `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound-race.com'}/events/${eventId}/register`,
      },
      receipt_email: userEmail,
      description: `${eventRef.title} - Billets et options`,
    })

    await sendMetaCapiEvent({
      eventName: 'InitiateCheckout',
      eventId: `initiate_checkout_${paymentIntent.id}`,
      eventSourceUrl:
        request.headers.get('referer') ??
        request.headers.get('origin') ??
        `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound-race.com'}/events/${eventId}/register`,
      userData: {
        email: userEmail,
        externalId: userId,
        clientIpAddress,
        clientUserAgent,
        fbp,
        fbc,
      },
      customData: {
        currency: currency.toUpperCase(),
        value: Number((totalAmount / 100).toFixed(2)),
        content_type: 'product',
        content_ids: ticketSelections.map((item: any) => String(item.ticketId)),
        content_name: eventRef.title,
        event_id: eventId,
      },
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
      appliedPromo: primaryPromo,
      appliedPromos,
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
      promoCodes: promoCodes.join(','),
      ambassadorReferralCode,
    })

    return respondJson({ error: 'Erreur lors de la préparation du paiement.' }, 500)
  }
}
