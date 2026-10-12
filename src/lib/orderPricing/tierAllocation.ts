import { parseTierDate } from '@/types/EventPriceTier'
import { fail, ok, type PricingError, type PricingTier, type Result, type TierAllocation } from './types'

const timeOf = (value: string | null, fallback: number) => parseTierDate(value)?.getTime() ?? fallback

const isActiveAt = (tier: PricingTier, now: Date) => {
  const time = now.getTime()
  return time >= timeOf(tier.availableFrom, 0) && time < timeOf(tier.availableUntil, Infinity)
}

/** Tiers in selling order: display order first, then start date. */
export const sortTiers = (tiers: PricingTier[]): PricingTier[] =>
  [...tiers].sort((a, b) => {
    const byOrder = (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    if (byOrder !== 0) return byOrder
    return timeOf(a.availableFrom, 0) - timeOf(b.availableFrom, 0)
  })

export interface TierAssignment {
  allocations: TierAllocation[]
  /** Tier of each participant, in order. Empty when no tier is on sale. */
  tierIdByParticipant: Array<string | null>
}

/**
 * Seats the order on the active tier, then spills the participants that do not
 * fit onto the following tiers. No tier on sale means full price for everyone.
 */
export const assignParticipantsToTiers = (
  tiers: PricingTier[],
  registrationCounts: Record<string, number>,
  participantCount: number,
  now: Date,
): Result<TierAssignment, PricingError> => {
  const sorted = sortTiers(tiers)
  const activeIndex = sorted.findIndex((tier) => isActiveAt(tier, now))
  if (participantCount <= 0 || activeIndex === -1) {
    return ok({ allocations: [], tierIdByParticipant: Array(Math.max(participantCount, 0)).fill(null) })
  }

  const allocations: TierAllocation[] = []
  let remaining = participantCount
  for (const tier of sorted.slice(activeIndex)) {
    if (remaining === 0) break
    const used = registrationCounts[tier.id] ?? 0
    const available = tier.maxRegistrations == null ? remaining : Math.max(tier.maxRegistrations - used, 0)
    const quantity = Math.min(available, remaining)
    if (quantity === 0) continue
    allocations.push({ tierId: tier.id, quantity })
    remaining -= quantity
  }

  if (remaining > 0) return fail({ kind: 'TIERS_SOLD_OUT' })

  return ok({
    allocations,
    tierIdByParticipant: allocations.flatMap(({ tierId, quantity }) => Array<string>(quantity).fill(tierId)),
  })
}

/** The tier a new ticket is sold on right now: the active one, or the next one with room left. */
export const sellingTierId = (tiers: PricingTier[], registrationCounts: Record<string, number>, now: Date) => {
  const seating = assignParticipantsToTiers(tiers, registrationCounts, 1, now)
  return seating.ok ? (seating.value.tierIdByParticipant[0] ?? null) : null
}
