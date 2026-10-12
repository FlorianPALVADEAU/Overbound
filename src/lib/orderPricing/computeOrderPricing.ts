import { allocatePaidTicketPrices } from '@/lib/tickets/flexibleTicket'
import { createBalance } from './balance'
import { priceParticipants } from './participantPricing'
import { applyDiscounts } from './promo/applyDiscounts'
import { checkPromoQuota } from './promo/quota'
import { assignParticipantsToTiers } from './tierAllocation'
import { ok, type OrderPricing, type OrderPricingInput, type PricingError, type Result } from './types'
import { subtotalsByUpsell, sumValues } from './upsellPricing'

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

/**
 * Prices a whole order: tiers, upsells, promo codes and the flexible option.
 * The single source of truth for both the checkout preview and the amount
 * charged by Stripe.
 */
export const computeOrderPricing = (input: OrderPricingInput): Result<OrderPricing, PricingError> => {
  const seating = assignParticipantsToTiers(input.tiers, input.tierRegistrationCounts, input.participants.length, input.now)
  if (!seating.ok) return seating

  const priced = priceParticipants(input.participants, input.tickets, input.tiers, seating.value.tierIdByParticipant)
  if (!priced.ok) return priced
  const participants = priced.value

  const baseTicketSubtotal = sum(participants.map((participant) => participant.basePriceCents))
  const ticketSubtotal = sum(participants.map((participant) => participant.unitPriceCents))
  const tierDiscountAmount = Math.max(baseTicketSubtotal - ticketSubtotal, 0)
  const upsellSubtotalsById = subtotalsByUpsell(input.upsellLines, input.upsells)
  const upsellSubtotal = sumValues(upsellSubtotalsById)

  const quota = checkPromoQuota(input.promos)
  const { discounts, rejections } = applyDiscounts(
    quota.kept,
    createBalance(ticketSubtotal, upsellSubtotalsById),
    { participants, baseTicketSubtotal, tierDiscountAmount },
  )

  const ticketDiscountAmount = sum(discounts.filter((d) => d.target.kind === 'tickets').map((d) => d.amountCents))
  const upsellDiscountAmount = sum(discounts.filter((d) => d.target.kind === 'upsell').map((d) => d.amountCents))
  const discountAmount = ticketDiscountAmount + upsellDiscountAmount
  // Never discounted: the option is a refund right, not part of the ticket price.
  const flexibleTotal = participants.filter((participant) => participant.flexible).length * input.flexibleFeeCents
  const paidPrices = allocatePaidTicketPrices(
    participants.map((participant) => participant.unitPriceCents),
    ticketDiscountAmount,
  )

  return ok({
    participants: participants.map(({ isOpenFormat: _isOpenFormat, ...participant }, index) => ({
      ...participant,
      paidPriceCents: paidPrices[index] ?? participant.unitPriceCents,
    })),
    tierAllocations: seating.value.allocations,
    baseTicketSubtotal,
    ticketSubtotal,
    tierDiscountAmount,
    upsellSubtotal,
    upsellSubtotalsById,
    flexibleTotal,
    discounts,
    ticketDiscountAmount,
    upsellDiscountAmount,
    discountAmount,
    totalDue: Math.max(ticketSubtotal + upsellSubtotal - discountAmount, 0) + flexibleTotal,
    rejections: [...quota.rejections, ...rejections],
  })
}

