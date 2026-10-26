import { allocatePaidTicketPrices } from '@/lib/tickets/flexibleTicket'
import { createBalance } from './balance'
import { computeGroupDiscount } from './groupDiscount'
import { applyTierDiscount, priceParticipants } from './participantPricing'
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
  const { discounts: allDiscounts, rejections } = applyDiscounts(
    quota.kept,
    createBalance(ticketSubtotal, upsellSubtotalsById),
    { participants, baseTicketSubtotal, tierDiscountAmount },
  )

  // Group discount and ticket codes never add up: the better one applies. A tie goes to the
  // group discount. A beaten code stays on the order at 0 € so the ambassador still gets credit.
  const group = computeGroupDiscount(participants)
  const codeTicketDiscount = sum(allDiscounts.filter((d) => d.target.kind === 'tickets').map((d) => d.amountCents))
  const groupApplies = group.amountCents > 0 && group.amountCents >= codeTicketDiscount
  const discounts = groupApplies
    ? allDiscounts.map((d) => (d.target.kind === 'tickets' ? { ...d, amountCents: 0 } : d))
    : allDiscounts
  const ticketDiscountAmount = groupApplies ? group.amountCents : codeTicketDiscount
  const upsellDiscountAmount = sum(discounts.filter((d) => d.target.kind === 'upsell').map((d) => d.amountCents))
  const discountAmount = ticketDiscountAmount + upsellDiscountAmount
  // Never discounted: the option is a refund right, not part of the ticket price.
  const flexibleTotal = participants.filter((participant) => participant.flexible).length * input.flexibleFeeCents
  // The group discount belongs to the OPEN bibs alone; a code is spread over every bib.
  const paidPrices = groupApplies
    ? participants.map((participant) =>
        participant.isOpenFormat ? applyTierDiscount(participant.unitPriceCents, group.percent) : participant.unitPriceCents,
      )
    : allocatePaidTicketPrices(
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
    groupDiscount: { percent: group.percent, amountCents: group.amountCents, applied: groupApplies },
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

