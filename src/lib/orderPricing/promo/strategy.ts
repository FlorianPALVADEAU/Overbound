import type { RemainingBalance } from '../balance'
import type { TierPricedParticipant } from '../participantPricing'
import type { DiscountTarget, PricingPromo, PromoRejectionReason } from '../types'

/** Facts about the order that some codes need, computed once before any code applies. */
export interface DiscountContext {
  participants: readonly TierPricedParticipant[]
  baseTicketSubtotal: number
  tierDiscountAmount: number
}

export type DiscountOutcome =
  | { kind: 'applied'; target: DiscountTarget; amountCents: number }
  | { kind: 'rejected'; reason: PromoRejectionReason }

/**
 * One family of promo codes. A new family is a new strategy registered in
 * `strategies/index.ts`; the engine itself never changes.
 */
export interface DiscountStrategy {
  readonly name: string
  /** Lower runs first. Each code discounts what earlier codes left to pay. */
  readonly priority: number
  matches(promo: PricingPromo): boolean
  apply(promo: PricingPromo, balance: RemainingBalance, context: DiscountContext): DiscountOutcome
}
