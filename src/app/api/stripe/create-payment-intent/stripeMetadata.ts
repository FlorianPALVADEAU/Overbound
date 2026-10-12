import type { OrderPricing } from '@/lib/orderPricing'
import { serializeNumberList } from '@/lib/tickets/flexibleTicket'

interface OrderMetadataArgs {
  pricing: OrderPricing
  currency: string
  primaryPromoCode: string
  ambassadorReferralCode: string | null
  utmParams: string
}

/**
 * Order facts carried by the PaymentIntent (or the free order) and read back by
 * /api/registrations/create and the Stripe webhook. Stripe metadata values are strings.
 */
export const buildOrderMetadata = ({ pricing, currency, primaryPromoCode, ambassadorReferralCode, utmParams }: OrderMetadataArgs) => ({
  currency,
  discount_applied: pricing.discountAmount.toString(),
  tier_allocations: JSON.stringify(
    pricing.tierAllocations.map((allocation) => ({ tier_id: allocation.tierId, quantity: allocation.quantity })),
  ),
  ambassador_referral_code: ambassadorReferralCode ?? '',
  promo_codes: pricing.discounts.map((discount) => discount.code).join(','),
  promo_code: primaryPromoCode,
  utm_params: utmParams,
  flexible_participants: serializeNumberList(
    pricing.participants.flatMap((participant, index) => (participant.flexible ? [index] : [])),
  ),
  ticket_prices: serializeNumberList(pricing.participants.map((participant) => participant.paidPriceCents)),
})
