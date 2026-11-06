import { applyTierDiscount, type TierPricedParticipant } from './participantPricing'
import type { GroupDiscountLine, ProductFormat } from './types'

/**
 * FDR-0019, amended 2026-11-06: the tiers count tickets of ONE format only. Two OPEN tickets get
 * 10 % off each; one OPEN and one RANKED get nothing. Highest threshold first.
 */
export const GROUP_DISCOUNT_TIERS: ReadonlyArray<{ minTickets: number; percent: number }> = [
  { minTickets: 6, percent: 20 },
  { minTickets: 3, percent: 15 },
  { minTickets: 2, percent: 10 },
]

export const groupDiscountPercent = (tickets: number): number =>
  GROUP_DISCOUNT_TIERS.find((groupTier) => tickets >= groupTier.minTickets)?.percent ?? 0

const FORMATS: readonly ProductFormat[] = ['open', 'ranked']

const FORMAT_NAMES: Record<ProductFormat, string> = { open: 'OPEN', ranked: 'RANKED' }

export const groupDiscountLabel = (line: Pick<GroupDiscountLine, 'format' | 'percent'>): string =>
  `Remise groupe ${FORMAT_NAMES[line.format]} −${line.percent} %`

export interface GroupDiscount {
  /** Percent off each bib of a format. 0 for a format with fewer than 2 bibs in the order. */
  percentByFormat: Record<ProductFormat, number>
  /** One line per format that gets a discount. */
  lines: GroupDiscountLine[]
  /** What the discount is worth on the order, whether or not it ends up applied. */
  amountCents: number
}

/** Counts the tickets of each format apart, and discounts the tickets of each format by their own count. */
export const computeGroupDiscount = (participants: readonly TierPricedParticipant[]): GroupDiscount => {
  const percentByFormat = { open: 0, ranked: 0 }
  const lines: GroupDiscountLine[] = []
  for (const format of FORMATS) {
    const ofFormat = participants.filter((participant) => participantFormat(participant) === format)
    const percent = groupDiscountPercent(ofFormat.length)
    percentByFormat[format] = percent
    if (percent === 0) continue
    const amountCents = ofFormat.reduce(
      (total, participant) => total + participant.unitPriceCents - applyTierDiscount(participant.unitPriceCents, percent),
      0,
    )
    lines.push({ format, ticketCount: ofFormat.length, percent, amountCents })
  }
  return {
    percentByFormat,
    lines,
    amountCents: lines.reduce((total, line) => total + line.amountCents, 0),
  }
}

export const participantFormat = (participant: Pick<TierPricedParticipant, 'isOpenFormat'>): ProductFormat =>
  participant.isOpenFormat ? 'open' : 'ranked'
