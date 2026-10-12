import {
  fail,
  ok,
  type PricingError,
  type PricingParticipantInput,
  type PricingTicket,
  type PricingTier,
  type Result,
} from './types'

export interface TierPricedParticipant {
  ticketId: string
  tierId: string | null
  basePriceCents: number
  unitPriceCents: number
  isOpenFormat: boolean
  flexible: boolean
}

export const applyTierDiscount = (priceCents: number, discountPercentage: number) =>
  Math.round(priceCents * (1 - discountPercentage / 100))

/** Prices every participant's ticket, with the tier they were seated on. */
export const priceParticipants = (
  participants: PricingParticipantInput[],
  tickets: PricingTicket[],
  tiers: PricingTier[],
  tierIdByParticipant: Array<string | null>,
): Result<TierPricedParticipant[], PricingError> => {
  const ticketById = new Map(tickets.map((ticket) => [ticket.id, ticket]))
  const tierById = new Map(tiers.map((tier) => [tier.id, tier]))
  const priced: TierPricedParticipant[] = []

  for (const [index, participant] of participants.entries()) {
    const ticket = ticketById.get(participant.ticketId)
    if (!ticket) return fail({ kind: 'UNKNOWN_TICKET', ticketId: participant.ticketId })
    if (!ticket.finalPriceCents) {
      return fail({ kind: 'TICKET_PRICE_MISSING', ticketId: ticket.id, ticketName: ticket.name })
    }

    const tierId = tierIdByParticipant[index] ?? null
    const tier = tierId ? tierById.get(tierId) : undefined
    priced.push({
      ticketId: ticket.id,
      tierId,
      basePriceCents: ticket.finalPriceCents,
      unitPriceCents: tier ? applyTierDiscount(ticket.finalPriceCents, tier.discountPercentage) : ticket.finalPriceCents,
      isOpenFormat: ticket.isOpenFormat,
      flexible: participant.flexible,
    })
  }

  return ok(priced)
}
