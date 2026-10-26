import { applyTierDiscount, type TierPricedParticipant } from './participantPricing'

/** FDR-0019: one order with several OPEN tickets gets a percentage off those tickets. Highest threshold first. */
export const GROUP_DISCOUNT_TIERS: ReadonlyArray<{ minOpenTickets: number; percent: number }> = [
  { minOpenTickets: 6, percent: 20 },
  { minOpenTickets: 3, percent: 15 },
  { minOpenTickets: 2, percent: 10 },
]

export const groupDiscountPercent = (openTickets: number): number =>
  GROUP_DISCOUNT_TIERS.find((groupTier) => openTickets >= groupTier.minOpenTickets)?.percent ?? 0

export interface GroupDiscount {
  percent: number
  /** What the discount is worth on the order, whether or not it ends up applied. */
  amountCents: number
}

/** Counts the OPEN tickets of one order; RANKED tickets neither count nor get discounted. */
export const computeGroupDiscount = (participants: readonly TierPricedParticipant[]): GroupDiscount => {
  const open = participants.filter((participant) => participant.isOpenFormat)
  const percent = groupDiscountPercent(open.length)
  const amountCents = open.reduce(
    (total, participant) => total + participant.unitPriceCents - applyTierDiscount(participant.unitPriceCents, percent),
    0,
  )
  return { percent, amountCents }
}
