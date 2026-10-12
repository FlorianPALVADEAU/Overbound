import type { PricingPromo } from '../types'

/** Discount of a code on an amount: its percentage, else its fixed amount, never more than the amount. */
export const discountOn = (promo: PricingPromo, amountCents: number): number => {
  if (amountCents <= 0) return 0
  if (promo.discountPercent && promo.discountPercent > 0) {
    return Math.min(amountCents, Math.round((amountCents * promo.discountPercent) / 100))
  }
  if (promo.discountAmountCents && promo.discountAmountCents > 0) {
    return Math.min(amountCents, promo.discountAmountCents)
  }
  return 0
}
