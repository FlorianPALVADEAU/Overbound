import type { OrderPricing } from '@/lib/orderPricing'
import { serializeNumberList } from '@/lib/tickets/flexibleTicket'
import { CGV_VERSION } from '@/constants/legalVersions'

interface OrderMetadataArgs {
  pricing: OrderPricing
  currency: string
  primaryPromoCode: string
  ambassadorReferralCode: string | null
  utmParams: string
  /** SAS OPEN chosen for each participant's companion bib, by position; null when they have none. */
  companionWaveIndexes: Array<number | null>
}

/**
 * Order facts carried by the PaymentIntent (or the free order) and read back by
 * /api/registrations/create and the Stripe webhook. Stripe metadata values are strings.
 */
export const buildOrderMetadata = ({ pricing, currency, primaryPromoCode, ambassadorReferralCode, utmParams, companionWaveIndexes }: OrderMetadataArgs) => {
  const companions = pricing.participants.flatMap((participant, index) =>
    participant.companionPriceCents > 0 && companionWaveIndexes[index] != null
      ? [{ index, waveIndex: companionWaveIndexes[index] as number, priceCents: participant.companionPriceCents }]
      : [],
  )
  return {
  currency,
  discount_applied: pricing.discountAmount.toString(),
  tier_allocations: JSON.stringify(
    pricing.tierAllocations.map((allocation) => ({ tier_id: allocation.tierId, quantity: allocation.quantity })),
  ),
  ambassador_referral_code: ambassadorReferralCode ?? '',
  promo_codes: pricing.discounts.map((discount) => discount.code).join(','),
  promo_code: primaryPromoCode,
  utm_params: utmParams,
  cgv_version: CGV_VERSION,
  flexible_participants: serializeNumberList(
    pricing.participants.flatMap((participant, index) => (participant.flexible ? [index] : [])),
  ),
  ticket_prices: serializeNumberList(pricing.participants.map((participant) => participant.paidPriceCents)),
  companion_participants: serializeNumberList(companions.map((companion) => companion.index)),
  companion_waves: serializeNumberList(companions.map((companion) => companion.waveIndex)),
  companion_prices: serializeNumberList(companions.map((companion) => companion.priceCents)),
  }
}
