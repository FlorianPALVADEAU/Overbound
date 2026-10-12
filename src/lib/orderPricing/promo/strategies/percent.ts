import { remainingFor } from '../../balance'
import { discountOn } from '../discountAmount'
import type { DiscountStrategy } from '../strategy'

const TICKETS = { kind: 'tickets' } as const

/** Percentage off what is still left to pay on the tickets. */
export const percentStrategy: DiscountStrategy = {
  name: 'percent',
  priority: 30,
  matches: (promo) => !promo.targetUpsellId && (promo.discountPercent ?? 0) > 0,
  apply: (promo, balance) => ({
    kind: 'applied',
    target: TICKETS,
    amountCents: discountOn(promo, remainingFor(balance, TICKETS)),
  }),
}
