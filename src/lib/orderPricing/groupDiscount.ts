import { applyTierDiscount, type TierPricedParticipant } from './participantPricing'

/**
 * FDR-0019: one order with several tickets, OPEN and RANKED counted together, gets a percentage off
 * every ticket (the OPEN-only rule was dropped on 2026-10-29: a team mixes formats). Highest threshold first.
 */
export const GROUP_DISCOUNT_TIERS: ReadonlyArray<{ minTickets: number; percent: number }> = [
  { minTickets: 6, percent: 20 },
  { minTickets: 3, percent: 15 },
  { minTickets: 2, percent: 10 },
]

export const groupDiscountPercent = (tickets: number): number =>
  GROUP_DISCOUNT_TIERS.find((groupTier) => tickets >= groupTier.minTickets)?.percent ?? 0

export interface GroupDiscount {
  percent: number
  /** What the discount is worth on the order, whether or not it ends up applied. */
  amountCents: number
}

/** Counts every ticket of one order, whatever its format, and discounts each of them. */
export const computeGroupDiscount = (participants: readonly TierPricedParticipant[]): GroupDiscount => {
  const percent = groupDiscountPercent(participants.length)
  const amountCents = participants.reduce(
    (total, participant) => total + participant.unitPriceCents - applyTierDiscount(participant.unitPriceCents, percent),
    0,
  )
  return { percent, amountCents }
}
