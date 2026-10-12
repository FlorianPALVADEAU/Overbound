import { remainingFor } from '../../balance'
import { discountOn } from '../discountAmount'
import type { DiscountStrategy } from '../strategy'

/** Codes scoped to one upsell: they discount that upsell only, and nothing when it is not in the cart. */
export const productStrategy: DiscountStrategy = {
  name: 'product',
  priority: 50,
  matches: (promo) => Boolean(promo.targetUpsellId),
  apply: (promo, balance) => {
    const target = { kind: 'upsell', upsellId: promo.targetUpsellId as string } as const
    return { kind: 'applied', target, amountCents: discountOn(promo, remainingFor(balance, target)) }
  },
}
