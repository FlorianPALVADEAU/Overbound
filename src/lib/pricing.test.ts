import { describe, it, expect } from 'vitest'
import {
  formatPrice,
  getStartingPrice,
  validatePriceTiers,
  isPriceChangeImminent,
  getNextPriceChange,
  getCurrentTicketPrice,
  getPriceTiersForTimeline,
} from './pricing'
import { EventPriceTier } from '@/types/EventPriceTier'
import { Ticket } from '@/types/Ticket'

describe('Pricing Utils', () => {
  // Helper to create a test tier
  const createTier = (
    id: string,
    availableFrom: Date | null,
    availableUntil: Date | null,
    discountPercentage = 0
  ): EventPriceTier => ({
    id,
    event_id: 'event1',
    name: `Tier ${id}`,
    discount_percentage: discountPercentage,
    available_from: availableFrom?.toISOString() || null,
    available_until: availableUntil?.toISOString() || null,
    display_order: 0,
    max_registrations: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  // Helper to create a test ticket
  const createTicket = (finalPriceCents: number): Ticket =>
    ({
      id: 'ticket1',
      event_id: 'event1',
      name: 'Standard Ticket',
      final_price_cents: finalPriceCents,
      currency: 'eur',
    }) as Ticket

  describe('formatPrice', () => {
    it('should format EUR correctly', () => {
      expect(formatPrice(2000, 'EUR')).toBe('20 €')
      expect(formatPrice(5500, 'EUR')).toBe('55 €')
    })

    it('should format USD correctly', () => {
      expect(formatPrice(2000, 'USD')).toBe('$20')
      expect(formatPrice(5500, 'USD')).toBe('$55')
    })

    it('should format GBP correctly', () => {
      expect(formatPrice(2000, 'GBP')).toBe('£20')
      expect(formatPrice(5500, 'GBP')).toBe('£55')
    })

    it('should handle unknown currency', () => {
      expect(formatPrice(2000, 'JPY')).toBe('20.00 JPY')
    })

    it('should handle case-insensitive currency codes', () => {
      expect(formatPrice(2000, 'eur')).toBe('20 €')
      expect(formatPrice(2000, 'usd')).toBe('$20')
    })

    it('should default to EUR when no currency provided', () => {
      expect(formatPrice(2000)).toBe('20 €')
    })

    it('should handle zero price', () => {
      expect(formatPrice(0, 'EUR')).toBe('0 €')
    })

    it('should round to integers for EUR/USD/GBP', () => {
      expect(formatPrice(5555, 'EUR')).toBe('56 €') // 55.55 rounded
    })
  })

  describe('getStartingPrice', () => {
    it('should return final price when no tiers', () => {
      const ticket = createTicket(10000)
      expect(getStartingPrice(ticket, [])).toBe(10000)
    })

    it('should return price with highest discount', () => {
      const ticket = createTicket(10000)
      const tiers = [
        createTier('tier1', null, null, 20),
        createTier('tier2', null, null, 50), // Highest discount
        createTier('tier3', null, null, 10),
      ]

      // 50% discount = 5000
      expect(getStartingPrice(ticket, tiers)).toBe(5000)
    })

    it('should handle single tier', () => {
      const ticket = createTicket(10000)
      const tiers = [createTier('tier1', null, null, 30)]

      expect(getStartingPrice(ticket, tiers)).toBe(7000)
    })

    it('should handle 0% discount tiers', () => {
      const ticket = createTicket(10000)
      const tiers = [createTier('tier1', null, null, 0)]

      expect(getStartingPrice(ticket, tiers)).toBe(10000)
    })
  })

  describe('validatePriceTiers', () => {
    it('should return invalid for empty array', () => {
      const result = validatePriceTiers([])
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Au moins un palier')
    })

    it('should validate correct tiers', () => {
      const tiers = [
        {
          discount_percentage: 30,
          available_from: '2025-06-01',
          available_until: '2025-06-10',
        },
        {
          discount_percentage: 20,
          available_from: '2025-06-10',
          available_until: '2025-06-20',
        },
      ]

      const result = validatePriceTiers(tiers)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject negative discount percentage', () => {
      const tiers = [
        {
          discount_percentage: -10,
          available_from: '2025-06-01',
          available_until: '2025-06-10',
        },
      ]

      const result = validatePriceTiers(tiers)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('entre 0 et 100')
    })

    it('should reject discount percentage > 100', () => {
      const tiers = [
        {
          discount_percentage: 150,
          available_from: '2025-06-01',
          available_until: '2025-06-10',
        },
      ]

      const result = validatePriceTiers(tiers)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('entre 0 et 100')
    })

    it('should reject when start date is after end date', () => {
      const tiers = [
        {
          discount_percentage: 20,
          available_from: '2025-06-20',
          available_until: '2025-06-10', // Before start!
        },
      ]

      const result = validatePriceTiers(tiers)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('début doit être avant')
    })

    it('should reject overlapping tiers', () => {
      const tiers = [
        {
          discount_percentage: 30,
          available_from: '2025-06-01',
          available_until: '2025-06-15', // Ends on 15th
        },
        {
          discount_percentage: 20,
          available_from: '2025-06-10', // Starts on 10th (overlap!)
          available_until: '2025-06-20',
        },
      ]

      const result = validatePriceTiers(tiers)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('chevauchent')
    })

    it('should accept tiers that touch but do not overlap', () => {
      const tiers = [
        {
          discount_percentage: 30,
          available_from: '2025-06-01',
          available_until: '2025-06-10',
        },
        {
          discount_percentage: 20,
          available_from: '2025-06-10', // Same as previous end
          available_until: '2025-06-20',
        },
      ]

      const result = validatePriceTiers(tiers)
      expect(result.isValid).toBe(true)
    })

    it('should accept tiers with gaps', () => {
      const tiers = [
        {
          discount_percentage: 30,
          available_from: '2025-06-01',
          available_until: '2025-06-10',
        },
        {
          discount_percentage: 20,
          available_from: '2025-06-15', // Gap of 5 days
          available_until: '2025-06-25',
        },
      ]

      const result = validatePriceTiers(tiers)
      expect(result.isValid).toBe(true)
    })
  })

  describe('isPriceChangeImminent', () => {
    it('should return false when no tiers', () => {
      const ticket = createTicket(10000)
      expect(isPriceChangeImminent(ticket, [])).toBe(false)
    })

    it('should return false when no future tiers', () => {
      const now = new Date('2025-06-25')
      const ticket = createTicket(10000)
      const tiers = [createTier('tier1', new Date('2025-06-01'), new Date('2025-06-10'), 30)]

      expect(isPriceChangeImminent(ticket, tiers, 7, now)).toBe(false)
    })

    it('should return true when next tier is within threshold', () => {
      const now = new Date('2025-06-05')
      const ticket = createTicket(10000)
      const tiers = [
        createTier('tier1', new Date('2025-06-01'), new Date('2025-06-10'), 30),
        createTier('tier2', new Date('2025-06-10'), new Date('2025-06-20'), 20), // 5 days away
      ]

      expect(isPriceChangeImminent(ticket, tiers, 7, now)).toBe(true)
    })

    it('should return false when next tier is beyond threshold', () => {
      const now = new Date('2025-06-01')
      const ticket = createTicket(10000)
      const tiers = [
        createTier('tier1', new Date('2025-06-01'), new Date('2025-06-10'), 30),
        createTier('tier2', new Date('2025-06-20'), new Date('2025-06-30'), 20), // 19 days away
      ]

      expect(isPriceChangeImminent(ticket, tiers, 7, now)).toBe(false)
    })

    it('should respect custom threshold', () => {
      const now = new Date('2025-06-01')
      const ticket = createTicket(10000)
      const tiers = [
        createTier('tier1', new Date('2025-06-01'), new Date('2025-06-10'), 30),
        createTier('tier2', new Date('2025-06-16'), new Date('2025-06-30'), 20), // 15 days away
      ]

      expect(isPriceChangeImminent(ticket, tiers, 7, now)).toBe(false)
      expect(isPriceChangeImminent(ticket, tiers, 30, now)).toBe(true)
    })
  })

  describe('getNextPriceChange', () => {
    it('should return null when no tiers', () => {
      const ticket = createTicket(10000)
      expect(getNextPriceChange(ticket, [])).toBeNull()
    })

    it('should return null when no future tiers', () => {
      const now = new Date('2025-06-25')
      const ticket = createTicket(10000)
      const tiers = [createTier('tier1', new Date('2025-06-01'), new Date('2025-06-10'), 30)]

      expect(getNextPriceChange(ticket, tiers, now)).toBeNull()
    })

    it('should return next price and date', () => {
      const now = new Date('2025-06-05')
      const ticket = createTicket(10000)
      const nextTierDate = new Date('2025-06-10')
      const tiers = [
        createTier('tier1', new Date('2025-06-01'), new Date('2025-06-10'), 30),
        createTier('tier2', nextTierDate, new Date('2025-06-20'), 20),
      ]

      const result = getNextPriceChange(ticket, tiers, now)
      expect(result).not.toBeNull()
      expect(result?.price_cents).toBe(8000) // 20% discount
      expect(result?.date.getTime()).toBe(nextTierDate.getTime())
    })
  })

  describe('getCurrentTicketPrice', () => {
    it('should return final price when no tiers', () => {
      const ticket = createTicket(10000)
      expect(getCurrentTicketPrice(ticket, [])).toBe(10000)
    })

    it('should return discounted price when tier is active', () => {
      const now = new Date('2025-06-15')
      const ticket = createTicket(10000)
      const tiers = [createTier('tier1', new Date('2025-06-10'), new Date('2025-06-20'), 30)]

      // 30% discount = 7000
      expect(getCurrentTicketPrice(ticket, tiers, now)).toBe(7000)
    })

    it('should return final price when no tier is active', () => {
      const now = new Date('2025-06-25')
      const ticket = createTicket(10000)
      const tiers = [createTier('tier1', new Date('2025-06-10'), new Date('2025-06-20'), 30)]

      expect(getCurrentTicketPrice(ticket, tiers, now)).toBe(10000)
    })
  })

  describe('getPriceTiersForTimeline', () => {
    it('should return empty array when no tiers', () => {
      expect(getPriceTiersForTimeline([])).toEqual([])
      expect(getPriceTiersForTimeline(undefined)).toEqual([])
    })

    it('should sort tiers by available_from', () => {
      const tiers = [
        createTier('tier3', new Date('2025-06-20'), new Date('2025-06-30'), 10),
        createTier('tier1', new Date('2025-06-01'), new Date('2025-06-10'), 30),
        createTier('tier2', new Date('2025-06-10'), new Date('2025-06-20'), 20),
      ]

      const sorted = getPriceTiersForTimeline(tiers)
      expect(sorted[0].id).toBe('tier1')
      expect(sorted[1].id).toBe('tier2')
      expect(sorted[2].id).toBe('tier3')
    })

    it('should not mutate original array', () => {
      const tiers = [
        createTier('tier2', new Date('2025-06-10'), new Date('2025-06-20'), 20),
        createTier('tier1', new Date('2025-06-01'), new Date('2025-06-10'), 30),
      ]

      const sorted = getPriceTiersForTimeline(tiers)
      expect(tiers[0].id).toBe('tier2') // Original unchanged
      expect(sorted[0].id).toBe('tier1') // Sorted
    })
  })
})
