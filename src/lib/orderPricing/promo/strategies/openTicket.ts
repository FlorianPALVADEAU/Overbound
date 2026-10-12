import { remainingFor } from '../../balance'
import { discountOn } from '../discountAmount'
import { isOpenTicketCode } from '../rules'
import type { DiscountStrategy } from '../strategy'

const TICKETS = { kind: 'tickets' } as const

/** "…OPENTICKET" codes: discount the first OPEN ticket of the order, and only that one. */
export const openTicketStrategy: DiscountStrategy = {
  name: 'openTicket',
  priority: 10,
  matches: (promo) => !promo.targetUpsellId && isOpenTicketCode(promo.code),
  apply: (promo, balance, { participants }) => {
    const firstOpen = participants.find((participant) => participant.isOpenFormat)
    if (!firstOpen) return { kind: 'rejected', reason: 'OPEN_TICKET_CODE_WITHOUT_OPEN_TICKET' }
    const amountCents = Math.min(discountOn(promo, firstOpen.unitPriceCents), remainingFor(balance, TICKETS))
    return { kind: 'applied', target: TICKETS, amountCents }
  },
}
