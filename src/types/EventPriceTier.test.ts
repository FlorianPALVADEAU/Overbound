import { describe, it, expect } from 'vitest'
import {
  getCurrentPriceTier,
  getNextPriceTier,
  sortPriceTiersByDate,
  isPriceTierActive,
  calculateCurrentPrice,
  formatDiscount,
  EventPriceTier,
} from './EventPriceTier'

describe('EventPriceTier Utils', () => {
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

  describe('getCurrentPriceTier', () => {
    it('should return null when no tiers exist', () => {
      expect(getCurrentPriceTier([])).toBeNull()
    })

    it('should return null when tiers array is undefined', () => {
      expect(getCurrentPriceTier(null as any)).toBeNull()
    })

    it('should return the active tier', () => {
      const now = new Date('2025-06-15T12:00:00Z')
      const tiers = [
        createTier('tier1', new Date('2025-06-01'), new Date('2025-06-10'), 30),
        createTier('tier2', new Date('2025-06-10'), new Date('2025-06-20'), 20),
        createTier('tier3', new Date('2025-06-20'), new Date('2025-06-30'), 10),
      ]

      const result = getCurrentPriceTier(tiers, now)
      expect(result?.id).toBe('tier2')
      expect(result?.discount_percentage).toBe(20)
    })

    it('should return null when no tier is active', () => {
      const now = new Date('2025-07-01T12:00:00Z')
      const tiers = [
        createTier('tier1', new Date('2025-06-01'), new Date('2025-06-10'), 30),
        createTier('tier2', new Date('2025-06-10'), new Date('2025-06-20'), 20),
      ]

      expect(getCurrentPriceTier(tiers, now)).toBeNull()
    })

    it('should handle tiers with null dates (always active)', () => {
      const now = new Date('2025-06-15T12:00:00Z')
      const tiers = [createTier('tier1', null, null, 20)]

      const result = getCurrentPriceTier(tiers, now)
      expect(result?.id).toBe('tier1')
    })

    it('should return the first matching tier when multiple are active', () => {
      const now = new Date('2025-06-15T12:00:00Z')
      const tiers = [
        createTier('tier1', new Date('2025-06-01'), new Date('2025-06-20'), 30),
        createTier('tier2', new Date('2025-06-10'), new Date('2025-06-25'), 20),
      ]

      const result = getCurrentPriceTier(tiers, now)
      expect(result?.id).toBe('tier1')
    })
  })

  describe('getNextPriceTier', () => {
    it('should return null when no tiers exist', () => {
      expect(getNextPriceTier([])).toBeNull()
    })

    it('should return the next upcoming tier', () => {
      const now = new Date('2025-06-05T12:00:00Z')
      const tiers = [
        createTier('tier1', new Date('2025-06-01'), new Date('2025-06-10'), 30),
        createTier('tier2', new Date('2025-06-10'), new Date('2025-06-20'), 20),
        createTier('tier3', new Date('2025-06-20'), new Date('2025-06-30'), 10),
      ]

      const result = getNextPriceTier(tiers, now)
      expect(result?.id).toBe('tier2')
    })

    it('should return null when no future tiers exist', () => {
      const now = new Date('2025-07-01T12:00:00Z')
      const tiers = [
        createTier('tier1', new Date('2025-06-01'), new Date('2025-06-10'), 30),
        createTier('tier2', new Date('2025-06-10'), new Date('2025-06-20'), 20),
      ]

      expect(getNextPriceTier(tiers, now)).toBeNull()
    })

    it('should return the closest future tier when multiple exist', () => {
      const now = new Date('2025-06-05T12:00:00Z')
      const tiers = [
        createTier('tier1', new Date('2025-06-01'), new Date('2025-06-10'), 30),
        createTier('tier2', new Date('2025-06-15'), new Date('2025-06-20'), 20),
        createTier('tier3', new Date('2025-06-10'), new Date('2025-06-15'), 25),
      ]

      const result = getNextPriceTier(tiers, now)
      expect(result?.id).toBe('tier3') // Starts at 2025-06-10, closest to now
    })
  })

  describe('sortPriceTiersByDate', () => {
    it('should sort tiers by available_from date', () => {
      const tiers = [
        createTier('tier3', new Date('2025-06-20'), new Date('2025-06-30'), 10),
        createTier('tier1', new Date('2025-06-01'), new Date('2025-06-10'), 30),
        createTier('tier2', new Date('2025-06-10'), new Date('2025-06-20'), 20),
      ]

      const sorted = sortPriceTiersByDate(tiers)
      expect(sorted[0].id).toBe('tier1')
      expect(sorted[1].id).toBe('tier2')
      expect(sorted[2].id).toBe('tier3')
    })

    it('should not mutate the original array', () => {
      const tiers = [
        createTier('tier2', new Date('2025-06-10'), new Date('2025-06-20'), 20),
        createTier('tier1', new Date('2025-06-01'), new Date('2025-06-10'), 30),
      ]

      const sorted = sortPriceTiersByDate(tiers)
      expect(tiers[0].id).toBe('tier2') // Original unchanged
      expect(sorted[0].id).toBe('tier1') // Sorted result
    })

    it('should handle tiers with null dates (treat as 0)', () => {
      const tiers = [
        createTier('tier2', new Date('2025-06-10'), new Date('2025-06-20'), 20),
        createTier('tier1', null, null, 30),
      ]

      const sorted = sortPriceTiersByDate(tiers)
      expect(sorted[0].id).toBe('tier1') // null date = 0 timestamp
      expect(sorted[1].id).toBe('tier2')
    })

    it('should handle empty array', () => {
      expect(sortPriceTiersByDate([])).toEqual([])
    })
  })

  describe('isPriceTierActive', () => {
    it('should return true when tier is currently active', () => {
      const now = new Date('2025-06-15T12:00:00Z')
      const tier = createTier('tier1', new Date('2025-06-10'), new Date('2025-06-20'), 20)

      expect(isPriceTierActive(tier, now)).toBe(true)
    })

    it('should return false when tier is in the past', () => {
      const now = new Date('2025-06-25T12:00:00Z')
      const tier = createTier('tier1', new Date('2025-06-10'), new Date('2025-06-20'), 20)

      expect(isPriceTierActive(tier, now)).toBe(false)
    })

    it('should return false when tier is in the future', () => {
      const now = new Date('2025-06-05T12:00:00Z')
      const tier = createTier('tier1', new Date('2025-06-10'), new Date('2025-06-20'), 20)

      expect(isPriceTierActive(tier, now)).toBe(false)
    })

    it('should return true at exact start time', () => {
      const now = new Date('2025-06-10T00:00:00Z')
      const tier = createTier('tier1', new Date('2025-06-10'), new Date('2025-06-20'), 20)

      expect(isPriceTierActive(tier, now)).toBe(true)
    })

    it('should return false at exact end time', () => {
      const now = new Date('2025-06-20T00:00:00Z')
      const tier = createTier('tier1', new Date('2025-06-10'), new Date('2025-06-20'), 20)

      expect(isPriceTierActive(tier, now)).toBe(false)
    })

    it('should return true when tier has null dates', () => {
      const now = new Date('2025-06-15T12:00:00Z')
      const tier = createTier('tier1', null, null, 20)

      expect(isPriceTierActive(tier, now)).toBe(true)
    })

    it('should return true when only start date is set and current time is after', () => {
      const now = new Date('2025-06-15T12:00:00Z')
      const tier = createTier('tier1', new Date('2025-06-10'), null, 20)

      expect(isPriceTierActive(tier, now)).toBe(true)
    })
  })

  describe('calculateCurrentPrice', () => {
    it('should return final price when no active tier', () => {
      expect(calculateCurrentPrice(10000, null)).toBe(10000)
    })

    it('should apply 20% discount correctly', () => {
      const tier = createTier('tier1', null, null, 20)
      expect(calculateCurrentPrice(10000, tier)).toBe(8000)
    })

    it('should apply 50% discount correctly', () => {
      const tier = createTier('tier1', null, null, 50)
      expect(calculateCurrentPrice(10000, tier)).toBe(5000)
    })

    it('should apply 0% discount (final price)', () => {
      const tier = createTier('tier1', null, null, 0)
      expect(calculateCurrentPrice(10000, tier)).toBe(10000)
    })

    it('should round to nearest cent', () => {
      const tier = createTier('tier1', null, null, 33)
      // 10000 * (1 - 0.33) = 6700
      expect(calculateCurrentPrice(10000, tier)).toBe(6700)
    })

    it('should handle 100% discount', () => {
      const tier = createTier('tier1', null, null, 100)
      expect(calculateCurrentPrice(10000, tier)).toBe(0)
    })

    it('should handle small amounts', () => {
      const tier = createTier('tier1', null, null, 20)
      expect(calculateCurrentPrice(100, tier)).toBe(80)
    })
  })

  describe('formatDiscount', () => {
    it('should format 0% as "Prix final"', () => {
      expect(formatDiscount(0)).toBe('Prix final')
    })

    it('should format percentage correctly', () => {
      expect(formatDiscount(20)).toBe('-20%')
      expect(formatDiscount(50)).toBe('-50%')
      expect(formatDiscount(100)).toBe('-100%')
    })

    it('should handle decimal percentages', () => {
      expect(formatDiscount(33.33)).toBe('-33.33%')
    })
  })
})
