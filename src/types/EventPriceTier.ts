import { Timestamp, UUID } from './base.type'

/**
 * Event-level price tier with percentage-based discounts
 * All tickets in the event inherit these price tiers
 */
export interface EventPriceTier {
  id: UUID
  event_id: UUID
  name: string
  discount_percentage: number // 0-100, where 0 = final price, 50 = 50% off
  available_from: Timestamp | null
  available_until: Timestamp | null
  display_order: number
  created_at: Timestamp
  updated_at: Timestamp
}

export type CreateEventPriceTier = Omit<EventPriceTier, 'id' | 'created_at' | 'updated_at'>
export type UpdateEventPriceTier = Partial<
  Omit<EventPriceTier, 'id' | 'created_at' | 'event_id'>
> & { id: UUID }

/**
 * Get the currently active price tier based on the current date
 * @param tiers - Array of price tiers sorted by available_from
 * @param now - Current date (defaults to new Date())
 * @returns The active price tier or null if none found
 */
export function getCurrentPriceTier(
  tiers: EventPriceTier[],
  now: Date = new Date()
): EventPriceTier | null {
  if (!tiers || tiers.length === 0) return null

  const currentTime = now.getTime()

  // Find the tier that is currently active
  const activeTier = tiers.find((tier) => {
    const startTime = tier.available_from ? new Date(tier.available_from).getTime() : 0
    const endTime = tier.available_until ? new Date(tier.available_until).getTime() : Infinity

    return currentTime >= startTime && currentTime < endTime
  })

  return activeTier || null
}

/**
 * Get the next upcoming price tier (for showing "Next price adjustment")
 * @param tiers - Array of price tiers sorted by available_from
 * @param now - Current date (defaults to new Date())
 * @returns The next tier or null if none found
 */
export function getNextPriceTier(
  tiers: EventPriceTier[],
  now: Date = new Date()
): EventPriceTier | null {
  if (!tiers || tiers.length === 0) return null

  const currentTime = now.getTime()

  // Find the next tier that starts after now
  const nextTier = tiers
    .filter((tier) => {
      const startTime = tier.available_from ? new Date(tier.available_from).getTime() : 0
      return startTime > currentTime
    })
    .sort((a, b) => {
      const aTime = a.available_from ? new Date(a.available_from).getTime() : 0
      const bTime = b.available_from ? new Date(b.available_from).getTime() : 0
      return aTime - bTime
    })[0]

  return nextTier || null
}

/**
 * Get all price tiers sorted by available_from date
 * @param tiers - Array of price tiers
 * @returns Sorted array of price tiers
 */
export function sortPriceTiersByDate(tiers: EventPriceTier[]): EventPriceTier[] {
  return [...tiers].sort((a, b) => {
    const aTime = a.available_from ? new Date(a.available_from).getTime() : 0
    const bTime = b.available_from ? new Date(b.available_from).getTime() : 0
    return aTime - bTime
  })
}

/**
 * Check if a price tier is currently active
 * @param tier - The price tier to check
 * @param now - Current date (defaults to new Date())
 * @returns True if the tier is currently active
 */
export function isPriceTierActive(tier: EventPriceTier, now: Date = new Date()): boolean {
  const currentTime = now.getTime()
  const startTime = tier.available_from ? new Date(tier.available_from).getTime() : 0
  const endTime = tier.available_until ? new Date(tier.available_until).getTime() : Infinity

  return currentTime >= startTime && currentTime < endTime
}

/**
 * Calculate the current price for a ticket based on active tier
 * @param finalPriceCents - The final price (100% price, 0% discount)
 * @param activeTier - The currently active price tier (or null)
 * @returns The calculated price in cents
 */
export function calculateCurrentPrice(
  finalPriceCents: number,
  activeTier: EventPriceTier | null
): number {
  if (!activeTier) return finalPriceCents

  const discountMultiplier = 1 - activeTier.discount_percentage / 100
  return Math.round(finalPriceCents * discountMultiplier)
}

/**
 * Format discount percentage for display
 * @param discountPercentage - The discount percentage (0-100)
 * @returns Formatted string like "-50%" or "Prix final"
 */
export function formatDiscount(discountPercentage: number): string {
  if (discountPercentage === 0) return 'Prix final'
  return `-${discountPercentage}%`
}
