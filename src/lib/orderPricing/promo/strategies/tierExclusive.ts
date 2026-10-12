import { remainingFor } from '../../balance'
import { discountOn } from '../discountAmount'
import { isTierExclusiveCode } from '../rules'
import type { DiscountStrategy } from '../strategy'

const TICKETS = { kind: 'tickets' } as const

/**
 * LUOFF30 / JUOFF50: the buyer gets the code or the tier, whichever is better,
 * never both. The code only adds what it gives beyond the tier discount.
 */
export const tierExclusiveStrategy: DiscountStrategy = {
  name: 'tierExclusive',
  priority: 20,
  matches: (promo) => !promo.targetUpsellId && isTierExclusiveCode(promo.code),
  apply: (promo, balance, { baseTicketSubtotal, tierDiscountAmount }) => {
    const beyondTier = Math.max(discountOn(promo, baseTicketSubtotal) - tierDiscountAmount, 0)
    return { kind: 'applied', target: TICKETS, amountCents: Math.min(beyondTier, remainingFor(balance, TICKETS)) }
  },
}
