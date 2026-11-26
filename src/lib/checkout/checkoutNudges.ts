import { GROUP_DISCOUNT_TIERS } from '@/lib/orderPricing'
import { getNextPriceTier, parseTierDate, type EventPriceTier } from '@/types/EventPriceTier'

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

const formatDate = (date: Date) => date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

/**
 * Real end of the tier the order is sold on, only when the price goes up after it.
 * Never invented: no end date or no increase means no sentence.
 */
const deadlineNudge = (sellingTier: EventPriceTier | null, tiers: EventPriceTier[], now: Date): string | null => {
  const end = sellingTier ? parseTierDate(sellingTier.available_until) : null
  if (!sellingTier || !end || end.getTime() <= now.getTime()) return null
  const next = getNextPriceTier(tiers, now)
  const priceGoesUp = !next || next.discount_percentage < sellingTier.discount_percentage
  return priceGoesUp ? `Tarif ${sellingTier.name} jusqu'au ${formatDate(end)}, ensuite le prix augmente.` : null
}

/** Honest reasons to order more or order now, for the checkout summary. */
export const checkoutNudges = (input: {
  formatCounts: FormatCounts
  sellingTier: EventPriceTier | null
  tiers: EventPriceTier[]
  now?: Date
}): string[] =>
  [
    groupNudge('open', input.formatCounts.open),
    groupNudge('ranked', input.formatCounts.ranked),
    deadlineNudge(input.sellingTier, input.tiers, input.now ?? new Date()),
  ].filter((nudge): nudge is string => nudge !== null)
