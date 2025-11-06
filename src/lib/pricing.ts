import { Ticket } from '@/types/Ticket'
import { TicketPriceTier, getCurrentPriceTier, getNextPriceTier } from '@/types/TicketPriceTier'

/**
 * Get the current price for a ticket based on price tiers or fallback to base_price_cents
 * @param ticket - The ticket with optional price_tiers
 * @param now - Current date (defaults to new Date())
 * @returns The current price in cents, or null if no price is available
 */
export function getCurrentTicketPrice(ticket: Ticket, now: Date = new Date()): number | null {
  // If ticket has price tiers, use them
  if (ticket.price_tiers && ticket.price_tiers.length > 0) {
    const currentTier = getCurrentPriceTier(ticket.price_tiers, now)
    if (currentTier) {
      return currentTier.price_cents
    }
    // If no current tier is active, fallback to the first one (for safety)
    return ticket.price_tiers[0]?.price_cents ?? null
  }

  // Fallback to base_price_cents if no tiers exist
  return ticket.base_price_cents ?? null
}

/**
 * Get the next price change information for a ticket
 * @param ticket - The ticket with price_tiers
 * @param now - Current date (defaults to new Date())
 * @returns Object with next price and date, or null if no next tier
 */
export function getNextPriceChange(
  ticket: Ticket,
  now: Date = new Date()
): { price_cents: number; date: Date } | null {
  if (!ticket.price_tiers || ticket.price_tiers.length === 0) {
    return null
  }

  const nextTier = getNextPriceTier(ticket.price_tiers, now)
  if (!nextTier || !nextTier.available_from) {
    return null
  }

  return {
    price_cents: nextTier.price_cents,
    date: new Date(nextTier.available_from)
  }
}

/**
 * Check if a price change is imminent (within specified days)
 * @param ticket - The ticket with price_tiers
 * @param daysThreshold - Number of days to consider as "imminent" (default: 7)
 * @param now - Current date (defaults to new Date())
 * @returns True if price change is within the threshold
 */
export function isPriceChangeImminent(
  ticket: Ticket,
  daysThreshold: number = 7,
  now: Date = new Date()
): boolean {
  const nextChange = getNextPriceChange(ticket, now)
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
 * Get the starting (lowest) price from ticket price tiers
 * @param ticket - The ticket with optional price_tiers
 * @returns The lowest price in cents, or null if no price is available
 */
export function getStartingPrice(ticket: Ticket): number | null {
  if (ticket.price_tiers && ticket.price_tiers.length > 0) {
    const prices = ticket.price_tiers.map((tier) => tier.price_cents)
    return Math.min(...prices)
  }

  return ticket.base_price_cents ?? null
}

/**
 * Get all price tiers sorted by date for timeline display
 * @param ticket - The ticket with price_tiers
 * @returns Array of price tiers sorted by available_from date
 */
export function getPriceTiersForTimeline(ticket: Ticket): TicketPriceTier[] {
  if (!ticket.price_tiers || ticket.price_tiers.length === 0) {
    return []
  }

  return [...ticket.price_tiers].sort((a, b) => {
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
  tiers: Array<Partial<TicketPriceTier>>
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

    // Validate price
    if (!tier.price_cents || tier.price_cents < 0) {
      return { isValid: false, error: `Palier ${i + 1}: Le prix doit être positif` }
    }

    // Validate date range
    if (tier.available_from && tier.available_until) {
      const start = new Date(tier.available_from)
      const end = new Date(tier.available_until)
      if (start >= end) {
        return {
          isValid: false,
          error: `Palier ${i + 1}: La date de début doit être avant la date de fin`
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
            error: `Paliers ${i + 1} et ${i + 2}: Les périodes se chevauchent`
          }
        }
      }
    }
  }

  return { isValid: true }
}
