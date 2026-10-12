import { deduct, type RemainingBalance } from '../balance'
import type { AppliedDiscount, PricingPromo, PromoRejection } from '../types'
import { normalizePromoCode } from './rules'
import type { DiscountContext, DiscountStrategy } from './strategy'
import { strategyFor } from './strategies'

interface Planned {
  promo: PricingPromo
  strategy: DiscountStrategy
}

/** Fixed order, whatever order the codes were typed in: by strategy priority, then by code. */
const plan = (promos: readonly PricingPromo[]): Planned[] =>
  promos
    .flatMap((promo) => {
      const strategy = strategyFor(promo)
      return strategy ? [{ promo, strategy }] : []
    })
    .sort(
      (a, b) =>
        a.strategy.priority - b.strategy.priority ||
        normalizePromoCode(a.promo.code).localeCompare(normalizePromoCode(b.promo.code)),
    )

/** Applies each code to what earlier codes left to pay. Codes worth nothing are left out. */
export const applyDiscounts = (
  promos: readonly PricingPromo[],
  initialBalance: RemainingBalance,
  context: DiscountContext,
) => {
  let balance = initialBalance
  const discounts: AppliedDiscount[] = []
  const rejections: PromoRejection[] = []

  for (const { promo, strategy } of plan(promos)) {
    const outcome = strategy.apply(promo, balance, context)
    if (outcome.kind === 'rejected') {
      rejections.push({ code: promo.code, reason: outcome.reason })
      continue
    }
    if (outcome.amountCents <= 0) continue
    balance = deduct(balance, outcome.target, outcome.amountCents)
    discounts.push({
      code: promo.code,
      target: outcome.target,
      amountCents: outcome.amountCents,
      isAmbassador: promo.isAmbassador,
    })
  }

  return { discounts, rejections }
}
