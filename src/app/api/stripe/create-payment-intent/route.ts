import { NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { captureException } from '@/lib/sentry'
import { isEventOpenForRegistration } from '@/lib/events/registrationStatus'
import { sendMetaCapiEvent } from '@/lib/analytics/metaCapi'
import { serializeUtmParams } from '@/lib/attribution/utm'
import { validateUpsellQuantities } from '@/lib/upsells/quantity'
import { validateUpsellAssignments } from '@/lib/upsells/assignments'
import { computeOrderPricing, toPricingSummary, type OrderPricing } from '@/lib/orderPricing'
import {
  buildPricingInput,
  fetchTierRegistrationCounts,
  hasAmbassadorLink,
  loadOrderPromos,
  pricingErrorFailure,
  promoRejectionFailure,
  type PromoRow,
} from '@/lib/orderPricing/server'
import { paymentIntentRequestSchema, readOrderCodes, readOrderParticipants } from '@/lib/checkout/paymentIntentRequest'
import { buildOrderMetadata } from './stripeMetadata'
import { checkOrderEligibility } from '@/lib/checkout/orderEligibility'
import {
  countActiveRegistrations,
  fetchTicketsForSelections,
  fetchUpsellsForEvent,
  groupHasAnchorOnEvent,
  respondJson,
  stripeClient,
} from './utils'

export const runtime = 'nodejs'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound-race.com'

/** The codes that actually discounted the order, in the shape the checkout already reads. */
const appliedPromoPayload = (pricing: OrderPricing, promoRows: PromoRow[]) =>
  pricing.discounts.flatMap((discount) => {
    const row = promoRows.find((promo) => promo.code.toUpperCase() === discount.code.toUpperCase())
    return row
      ? [{
          id: row.id,
          code: row.code,
          discount_percent: row.discount_percent,
          discount_amount: row.discount_amount,
          currency: row.currency,
          is_ambassador: discount.isAmbassador,
          target_upsell_id: row.target_upsell_id ?? null,
        }]
      : []
  })

export async function POST(request: NextRequest) {
  let context: Record<string, unknown> = {}

  try {
    const parsed = paymentIntentRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return respondJson({ error: 'Paramètres insuffisants.' }, 400)
    const body = parsed.data
    context = { eventId: body.eventId, userId: body.userId, ticketCount: body.ticketSelections.length }

    const orderCodes = readOrderCodes(body)
    if ('error' in orderCodes) return respondJson({ error: orderCodes.error }, 400)

    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== body.userId) return respondJson({ error: 'Non authentifié.' }, 401)

    const tickets = await fetchTicketsForSelections(supabase, body.ticketSelections.map((item) => item.ticketId))
    const event = tickets[0]?.event
    if (!event) return respondJson({ error: 'Impossible de récupérer les billets.' }, 404)
    if (event.id !== body.eventId || tickets.some((ticket) => ticket.event?.id !== event.id)) {
      return respondJson({ error: "Les billets ne correspondent pas à l'événement demandé." }, 400)
    }
    if (!isEventOpenForRegistration(event)) return respondJson({ error: 'Inscriptions fermées pour cet événement.' }, 409)

    // Seats, tier counts and promo codes are shop data, not the visitor's: their own session cannot read
    // other buyers' registrations, nor a code's ambassador link, so these reads use the admin client.
    const admin = supabaseAdmin()
    const participants = readOrderParticipants(body)
    const requestedCount = body.ticketSelections.reduce((total, item) => total + item.quantity, 0)
    if (requestedCount === 0) return respondJson({ error: 'Aucun billet sélectionné.' }, 400)
    if (participants.length !== requestedCount) {
      return respondJson({ error: 'Le nombre de participants ne correspond pas aux billets sélectionnés.' }, 422)
    }
    const ineligible = checkOrderEligibility(body.participants, {
      eventDate: event.date,
      tickets,
      hasGroupAnchor: await groupHasAnchorOnEvent(admin, body.groupId, body.userId, event.id),
    })
    if (ineligible) return respondJson({ error: ineligible }, 422)

    const availableSpots = (event.capacity ?? 0) - (await countActiveRegistrations(admin, event.id))
    if (requestedCount > availableSpots) {
      return respondJson({ error: "Plus assez de places disponibles pour l'ensemble des participants." }, 409)
    }

    const upsellRows = await fetchUpsellsForEvent(supabase, event.id)
    const upsellProducts = new Map(upsellRows.map((upsell) => [upsell.id, upsell]))
    const upsellError =
      validateUpsellQuantities(body.upsells, upsellProducts, participants.length) ??
      validateUpsellAssignments(body.upsells, upsellProducts, participants.length)
    if (upsellError) return respondJson({ error: upsellError }, 422)

    const now = new Date()
    const promos = await loadOrderPromos(admin, orderCodes.codes, event.id, now)
    if (!promos.ok) return respondJson({ error: promos.error.message }, promos.error.status)

    const priced = computeOrderPricing(
      buildPricingInput(
        {
          tickets,
          tiers: event.price_tiers ?? [],
          tierRegistrationCounts: await fetchTierRegistrationCounts(admin, event.id),
          upsells: upsellRows,
          promos: promos.value,
        },
        { participants, upsellLines: body.upsells, now },
      ),
    )
    if (!priced.ok) {
      const failure = pricingErrorFailure(priced.error)
      return respondJson({ error: failure.message }, failure.status)
    }
    const pricing = priced.value
    const [rejection] = pricing.rejections
    if (rejection) {
      const failure = promoRejectionFailure(rejection)
      return respondJson({ error: failure.message }, failure.status)
    }

    const currency = (tickets[0]?.currency || 'eur').toLowerCase()
    const appliedPromos = appliedPromoPayload(pricing, promos.value)
    const primaryPromo = appliedPromos.find((promo) => !promo.is_ambassador) ?? appliedPromos[0] ?? null
    const ambassadorReferralCode = promos.value.find((promo) => hasAmbassadorLink(promo.ambassadors))?.code ?? null
    const metadata = buildOrderMetadata({
      pricing,
      currency,
      primaryPromoCode: primaryPromo?.code ?? '',
      ambassadorReferralCode,
      utmParams: serializeUtmParams(body.utmParams),
    })
    const summary = toPricingSummary(pricing, currency)

    if (pricing.totalDue === 0) {
      return respondJson({
        freeOrder: true,
        freeOrderId: `free_${crypto.randomUUID()}`,
        pricing: summary,
        appliedPromo: primaryPromo,
        appliedPromos,
        freeOrderMetadata: metadata,
      })
    }

    const eventSourceUrl =
      request.headers.get('referer') ?? request.headers.get('origin') ?? `${SITE_URL}/events/${event.id}/register`
    const fbp = request.cookies.get('_fbp')?.value ?? ''
    const fbc = request.cookies.get('_fbc')?.value ?? ''

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: pricing.totalDue,
      currency,
      payment_method_types: ['card', 'link'],
      metadata: {
        ...metadata,
        registration_flow: 'multi',
        user_id: body.userId,
        event_id: event.id,
        event_title: event.title,
        ticket_count: String(body.ticketSelections.length),
        participant_count: String(participants.length),
        fbp,
        fbc,
        event_source_url: eventSourceUrl,
      },
      receipt_email: body.userEmail,
      description: `${event.title} - Billets et options`,
    })

    await sendMetaCapiEvent({
      eventName: 'InitiateCheckout',
      eventId: `initiate_checkout_${paymentIntent.id}`,
      eventSourceUrl,
      userData: {
        email: body.userEmail,
        externalId: body.userId,
        clientIpAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip'),
        clientUserAgent: request.headers.get('user-agent'),
        fbp: fbp || null,
        fbc: fbc || null,
      },
      customData: {
        currency: currency.toUpperCase(),
        value: Number((pricing.totalDue / 100).toFixed(2)),
        content_type: 'product',
        content_ids: body.ticketSelections.map((item) => item.ticketId),
        content_name: event.title,
        event_id: event.id,
      },
    })

    return respondJson({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      pricing: summary,
      appliedPromo: primaryPromo,
      appliedPromos,
    })
  } catch (error) {
    console.error('Erreur création PaymentIntent:', error)
    captureException(error as Error, { route: '/api/stripe/create-payment-intent', method: 'POST', ...context })
    return respondJson({ error: 'Erreur lors de la préparation du paiement.' }, 500)
  }
}
