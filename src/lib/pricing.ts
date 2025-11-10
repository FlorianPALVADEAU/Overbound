import { Ticket } from '@/types/Ticket'
import {
  EventPriceTier,
  getCurrentPriceTier,
  getNextPriceTier,
  calculateCurrentPrice,
} from '@/types/EventPriceTier'

/**
 * Get the current price for a ticket based on event price tiers
 * @param ticket - The ticket with final_price_cents
 * @param eventPriceTiers - Array of event price tiers
 * @param now - Current date (defaults to new Date())
 * @returns The current price in cents
 */
export function getCurrentTicketPrice(
  ticket: Ticket,
  eventPriceTiers: EventPriceTier[] = [],
  now: Date = new Date()
): number {
  const currentTier = getCurrentPriceTier(eventPriceTiers, now)
  return calculateCurrentPrice(ticket.final_price_cents, currentTier)
}

/**
 * Get the next price change information for a ticket
 * @param ticket - The ticket with final_price_cents
 * @param eventPriceTiers - Array of event price tiers
 * @param now - Current date (defaults to new Date())
 * @returns Object with next price and date, or null if no next tier
 */
export function getNextPriceChange(
  ticket: Ticket,
  eventPriceTiers: EventPriceTier[] = [],
  now: Date = new Date()
): { price_cents: number; date: Date } | null {
  if (!eventPriceTiers || eventPriceTiers.length === 0) {
    return null
  }

  const nextTier = getNextPriceTier(eventPriceTiers, now)
  if (!nextTier || !nextTier.available_from) {
    return null
  }

  return {
    price_cents: calculateCurrentPrice(ticket.final_price_cents, nextTier),
    date: new Date(nextTier.available_from),
  }
}

/**
 * Check if a price change is imminent (within specified days)
 * @param ticket - The ticket with final_price_cents
 * @param eventPriceTiers - Array of event price tiers
 * @param daysThreshold - Number of days to consider as "imminent" (default: 7)
 * @param now - Current date (defaults to new Date())
 * @returns True if price change is within the threshold
 */
export function isPriceChangeImminent(
  ticket: Ticket,
  eventPriceTiers: EventPriceTier[] = [],
  daysThreshold: number = 7,
  now: Date = new Date()
): boolean {
  const nextChange = getNextPriceChange(ticket, eventPriceTiers, now)
  if (!nextChange) {
    return false
  }

  const daysUntilChange = (nextChange.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return daysUntilChange <= daysThreshold && daysUntilChange > 0
}

/**
 * Format price in euros with proper currency display
 * @param priceCents - Price in cents
 * @param currency - Currency code (default: 'EUR')
 * @returns Formatted price string (e.g., "20 €")
 */
export function formatPrice(priceCents: number, currency: string = 'EUR'): string {
  const priceInUnits = priceCents / 100

  // Format based on currency
  switch (currency.toUpperCase()) {
    case 'EUR':
      return `${priceInUnits.toFixed(0)} €`
    case 'USD':
      return `$${priceInUnits.toFixed(0)}`
    case 'GBP':
      return `£${priceInUnits.toFixed(0)}`
    default:
      return `${priceInUnits.toFixed(2)} ${currency}`
  }
}

/**
 * Get the starting (lowest) price from event price tiers
 * @param ticket - The ticket with final_price_cents
 * @param eventPriceTiers - Array of event price tiers
 * @returns The lowest price in cents
 */
export function getStartingPrice(ticket: Ticket, eventPriceTiers: EventPriceTier[] = []): number {
  if (eventPriceTiers && eventPriceTiers.length > 0) {
    // Find the tier with the highest discount (lowest price)
    const maxDiscountTier = eventPriceTiers.reduce((max, tier) =>
      tier.discount_percentage > max.discount_percentage ? tier : max
    )
    return calculateCurrentPrice(ticket.final_price_cents, maxDiscountTier)
  }

  return ticket.final_price_cents
}

/**
 * Get all price tiers sorted by date for timeline display
 * @param eventPriceTiers - Array of event price tiers
 * @returns Array of price tiers sorted by available_from date
 */
export function getPriceTiersForTimeline(eventPriceTiers: EventPriceTier[] = []): EventPriceTier[] {
  if (!eventPriceTiers || eventPriceTiers.length === 0) {
    return []
  }

  return [...eventPriceTiers].sort((a, b) => {
    const aTime = a.available_from ? new Date(a.available_from).getTime() : 0
    const bTime = b.available_from ? new Date(b.available_from).getTime() : 0
    return aTime - bTime
  })
}

/**
 * Validate that price tiers don't overlap and are in chronological order
 * @param tiers - Array of price tiers to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validatePriceTiers(
  tiers: Array<Partial<EventPriceTier>>
): { isValid: boolean; error?: string } {
  if (!tiers || tiers.length === 0) {
    return { isValid: false, error: 'Au moins un palier de prix est requis' }
  }

  // Sort tiers by available_from
  const sortedTiers = [...tiers].sort((a, b) => {
    const aTime = a.available_from ? new Date(a.available_from).getTime() : 0
    const bTime = b.available_from ? new Date(b.available_from).getTime() : 0
    return aTime - bTime
  })

  // Check for overlaps and validate each tier
  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i]

    // Validate discount percentage
    if (
      tier.discount_percentage === undefined ||
      tier.discount_percentage < 0 ||
      tier.discount_percentage > 100
    ) {
      return {
        isValid: false,
        error: `Palier ${i + 1}: Le pourcentage de réduction doit être entre 0 et 100`,
      }
    }

    // Validate date range
    if (tier.available_from && tier.available_until) {
      const start = new Date(tier.available_from)
      const end = new Date(tier.available_until)
      if (start >= end) {
        return {
          isValid: false,
          error: `Palier ${i + 1}: La date de début doit être avant la date de fin`,
        }
      }
    }

    // Check overlap with next tier
    if (i < sortedTiers.length - 1) {
      const nextTier = sortedTiers[i + 1]
      if (tier.available_until && nextTier.available_from) {
        const currentEnd = new Date(tier.available_until)
        const nextStart = new Date(nextTier.available_from)
        if (currentEnd > nextStart) {
          return {
            isValid: false,
            error: `Paliers ${i + 1} et ${i + 2}: Les périodes se chevauchent`,
          }
        }
      }
    }
  }

  return { isValid: true }
}
