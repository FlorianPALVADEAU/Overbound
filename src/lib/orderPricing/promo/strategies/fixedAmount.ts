import { remainingFor } from '../../balance'
import { discountOn } from '../discountAmount'
import type { DiscountStrategy } from '../strategy'

const TICKETS = { kind: 'tickets' } as const

/** Fixed amount off what is still left to pay on the tickets. Runs after percentages. */
export const fixedAmountStrategy: DiscountStrategy = {
  name: 'fixedAmount',
  priority: 40,
  matches: (promo) => !promo.targetUpsellId && (promo.discountAmountCents ?? 0) > 0,
  apply: (promo, balance) => ({
    kind: 'applied',
    target: TICKETS,
    amountCents: discountOn(promo, remainingFor(balance, TICKETS)),
  }),
}
