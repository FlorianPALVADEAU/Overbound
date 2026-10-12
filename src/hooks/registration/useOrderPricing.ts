import { useMemo } from 'react'
import {
  computeOrderPricing,
  emptyPricingSummary,
  sellingTierId,
  toPricingSummary,
  toPricingTier,
  type OrderPricing,
  type PricingError,
  type PricingSummary,
} from '@/lib/orderPricing'
import { buildCheckoutPricingInput, type CheckoutPricingState } from '@/lib/checkout/pricingInput'

export interface CheckoutPricing {
  /** Null while the order cannot be priced (no ticket price, every tier full). */
  pricing: OrderPricing | null
  error: PricingError | null
  summary: PricingSummary
  /** Tier a new ticket is sold on right now, for the ticket cards. */
  sellingTierId: string | null
}

/** Prices the checkout with the same engine as the payment API. No arithmetic lives here. */
export function useOrderPricing(state: Omit<CheckoutPricingState, 'now'>, currency: string): CheckoutPricing {
  return useMemo(() => {
    const now = new Date()
    const result = computeOrderPricing(buildCheckoutPricingInput({ ...state, now }))
    const tierId = sellingTierId(state.tiers.map(toPricingTier), state.tierRegistrationCounts, now)
    return result.ok
      ? { pricing: result.value, error: null, summary: toPricingSummary(result.value, currency), sellingTierId: tierId }
      : { pricing: null, error: result.error, summary: emptyPricingSummary(currency), sellingTierId: tierId }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- each field of `state` is listed explicitly
  }, [
    currency,
    state.ticketSlots,
    state.flexibleBySlot,
    state.tickets,
    state.tiers,
    state.tierRegistrationCounts,
    state.upsells,
    state.selectedUpsells,
    state.appliedPromos,
  ])
}
