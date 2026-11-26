import { GROUP_DISCOUNT_TIERS } from '@/lib/orderPricing'

export interface FormatCounts {
  open: number
  ranked: number
}

const FORMAT_NAMES = { open: 'OPEN', ranked: 'RANKED' } as const

/** The next group tier a format is close to, as a plain sentence. Nothing for a format not in the order. */
const groupNudge = (format: keyof FormatCounts, count: number): string | null => {
  if (count < 1) return null
  const next = [...GROUP_DISCOUNT_TIERS].reverse().find((tier) => tier.minTickets > count)
  if (!next) return null
  const missing = next.minTickets - count
  return `Ajoute ${missing} billet${missing > 1 ? 's' : ''} ${FORMAT_NAMES[format]} : −${next.percent} % sur chacun des ${next.minTickets} billets ${FORMAT_NAMES[format]}.`
}

/** Honest reasons to add a bib, for the checkout summary. */
export const checkoutNudges = (input: { formatCounts: FormatCounts }): string[] =>
  [groupNudge('open', input.formatCounts.open), groupNudge('ranked', input.formatCounts.ranked)].filter(
    (nudge): nudge is string => nudge !== null,
  )
