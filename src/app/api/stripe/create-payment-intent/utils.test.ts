import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCurrentTicketPriceFromRow,
  getTicketSubtotal,
  getUpsellSubtotal,
  calcPromo,
  allocateParticipantsToTiers,
  expandTierAllocations,
} from './utils'

describe('Payment Calculation Utils', () => {
  describe('getCurrentTicketPriceFromRow', () => {
    it('should return final price when no price tiers exist', () => {
      const ticket = {
        id: '1',
        name: 'Standard Ticket',
        final_price_cents: 5000,
        currency: 'eur',
        event: {
          id: 'event1',
          title: 'Test Event',
          date: '2025-12-01',
          location: 'Paris',
          status: 'on_sale',
          capacity: 100,
          price_tiers: null,
        },
      }

      expect(getCurrentTicketPriceFromRow(ticket)).toBe(5000)
    })

    it('should return final price when no active tier is found', () => {
      const ticket = {
        id: '1',
        name: 'Standard Ticket',
        final_price_cents: 5000,
        currency: 'eur',
        event: {
          id: 'event1',
          title: 'Test Event',
          date: '2025-12-01',
          location: 'Paris',
          status: 'on_sale',
          capacity: 100,
          price_tiers: [
            {
              id: 'tier1',
              discount_percentage: 20,
              available_from: '2025-01-01',
              available_until: '2025-01-31',
            },
          ],
        },
      }

      // Current date is after the tier period
      expect(getCurrentTicketPriceFromRow(ticket)).toBe(5000)
    })

    it('should apply discount when tier is active', () => {
      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const ticket = {
        id: '1',
        name: 'Standard Ticket',
        final_price_cents: 5000,
        currency: 'eur',
        event: {
          id: 'event1',
          title: 'Test Event',
          date: '2025-12-01',
          location: 'Paris',
          status: 'on_sale',
          capacity: 100,
          price_tiers: [
            {
              id: 'tier1',
              discount_percentage: 20,
              available_from: yesterday.toISOString(),
              available_until: tomorrow.toISOString(),
            },
          ],
        },
      }

      // 20% discount on 5000 = 4000
      expect(getCurrentTicketPriceFromRow(ticket)).toBe(4000)
    })

    it('should apply 50% discount correctly', () => {
      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const ticket = {
        id: '1',
        name: 'Standard Ticket',
        final_price_cents: 10000,
        currency: 'eur',
        event: {
          id: 'event1',
          title: 'Test Event',
          date: '2025-12-01',
          location: 'Paris',
          status: 'on_sale',
          capacity: 100,
          price_tiers: [
            {
              id: 'tier1',
              discount_percentage: 50,
              available_from: yesterday.toISOString(),
              available_until: tomorrow.toISOString(),
            },
          ],
        },
      }

      // 50% discount on 10000 = 5000
      expect(getCurrentTicketPriceFromRow(ticket)).toBe(5000)
    })

    it('should select the first matching tier when multiple tiers are active', () => {
      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const ticket = {
        id: '1',
        name: 'Standard Ticket',
        final_price_cents: 5000,
        currency: 'eur',
        event: {
          id: 'event1',
          title: 'Test Event',
          date: '2025-12-01',
          location: 'Paris',
          status: 'on_sale',
          capacity: 100,
          price_tiers: [
            {
              id: 'tier1',
              discount_percentage: 20,
              available_from: yesterday.toISOString(),
              available_until: tomorrow.toISOString(),
            },
            {
              id: 'tier2',
              discount_percentage: 30,
              available_from: yesterday.toISOString(),
              available_until: tomorrow.toISOString(),
            },
          ],
        },
      }

      // Should use first tier (20% discount)
      expect(getCurrentTicketPriceFromRow(ticket)).toBe(4000)
    })
  })

  describe('getTicketSubtotal', () => {
    it('should calculate correct subtotal for single ticket', () => {
      const ticketSelections = [{ ticketId: 'ticket1', quantity: 2 }]
      const ticketPriceMap = new Map([['ticket1', 5000]])

      expect(getTicketSubtotal(ticketSelections, ticketPriceMap)).toBe(10000)
    })

    it('should calculate correct subtotal for multiple tickets', () => {
      const ticketSelections = [
        { ticketId: 'ticket1', quantity: 2 },
        { ticketId: 'ticket2', quantity: 3 },
      ]
      const ticketPriceMap = new Map([
        ['ticket1', 5000],
        ['ticket2', 3000],
      ])

      // (2 * 5000) + (3 * 3000) = 10000 + 9000 = 19000
      expect(getTicketSubtotal(ticketSelections, ticketPriceMap)).toBe(19000)
    })

    it('should return 0 for unknown ticket IDs', () => {
      const ticketSelections = [{ ticketId: 'unknown', quantity: 2 }]
      const ticketPriceMap = new Map([['ticket1', 5000]])

      expect(getTicketSubtotal(ticketSelections, ticketPriceMap)).toBe(0)
    })

    it('should handle empty selections', () => {
      const ticketSelections: Array<{ ticketId: string; quantity: number }> = []
      const ticketPriceMap = new Map([['ticket1', 5000]])

      expect(getTicketSubtotal(ticketSelections, ticketPriceMap)).toBe(0)
    })

    it('should handle zero quantity', () => {
      const ticketSelections = [{ ticketId: 'ticket1', quantity: 0 }]
      const ticketPriceMap = new Map([['ticket1', 5000]])

      expect(getTicketSubtotal(ticketSelections, ticketPriceMap)).toBe(0)
    })
  })

  describe('getUpsellSubtotal', () => {
    it('should calculate correct subtotal for single upsell', () => {
      const upsells = [{ upsellId: 'upsell1', quantity: 2 }]
      const upsellMap = new Map([
        ['upsell1', { id: 'upsell1', price_cents: 1000 }],
      ])

      expect(getUpsellSubtotal(upsells, upsellMap)).toBe(2000)
    })

    it('should calculate correct subtotal for multiple upsells', () => {
      const upsells = [
        { upsellId: 'upsell1', quantity: 2 },
        { upsellId: 'upsell2', quantity: 1 },
      ]
      const upsellMap = new Map([
        ['upsell1', { id: 'upsell1', price_cents: 1000 }],
        ['upsell2', { id: 'upsell2', price_cents: 1500 }],
      ])

      // (2 * 1000) + (1 * 1500) = 3500
      expect(getUpsellSubtotal(upsells, upsellMap)).toBe(3500)
    })

    it('should ignore unknown upsell IDs', () => {
      const upsells = [{ upsellId: 'unknown', quantity: 2 }]
      const upsellMap = new Map([
        ['upsell1', { id: 'upsell1', price_cents: 1000 }],
      ])

      expect(getUpsellSubtotal(upsells, upsellMap)).toBe(0)
    })

    it('should handle empty upsells', () => {
      const upsells: Array<{ upsellId: string; quantity: number }> = []
      const upsellMap = new Map([
        ['upsell1', { id: 'upsell1', price_cents: 1000 }],
      ])

      expect(getUpsellSubtotal(upsells, upsellMap)).toBe(0)
    })
  })

  describe('calcPromo', () => {
    const basePromo = {
      id: 'promo1',
      code: 'SAVE20',
      discount_percent: null,
      discount_amount: null,
      currency: 'eur',
      is_active: true,
      valid_from: null,
      valid_until: null,
      usage_limit: null,
      used_count: 0,
      events: [],
    }

    it('should apply percentage discount correctly', () => {
      const promo = {
        ...basePromo,
        discount_percent: 20,
      }

      const result = calcPromo(promo, 10000)
      expect(result.discountAmount).toBe(2000) // 20% of 10000
      expect(result.appliedPromo?.code).toBe('SAVE20')
    })

    it('should apply fixed amount discount correctly', () => {
      const promo = {
        ...basePromo,
        discount_amount: 1500,
      }

      const result = calcPromo(promo, 10000)
      expect(result.discountAmount).toBe(1500)
      expect(result.appliedPromo?.code).toBe('SAVE20')
    })

    it('should not exceed ticket subtotal', () => {
      const promo = {
        ...basePromo,
        discount_amount: 15000,
      }

      const result = calcPromo(promo, 10000)
      expect(result.discountAmount).toBe(10000) // Capped at subtotal
    })

    it('should not apply inactive promo', () => {
      const promo = {
        ...basePromo,
        is_active: false,
        discount_percent: 20,
      }

      const result = calcPromo(promo, 10000)
      expect(result.discountAmount).toBe(0)
      expect(result.appliedPromo).toBeNull()
    })

    it('should not apply promo before valid_from date', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const promo = {
        ...basePromo,
        discount_percent: 20,
        valid_from: tomorrow.toISOString(),
      }

      const result = calcPromo(promo, 10000)
      expect(result.discountAmount).toBe(0)
      expect(result.appliedPromo).toBeNull()
    })

    it('should not apply promo after valid_until date', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const promo = {
        ...basePromo,
        discount_percent: 20,
        valid_until: yesterday.toISOString(),
      }

      const result = calcPromo(promo, 10000)
      expect(result.discountAmount).toBe(0)
      expect(result.appliedPromo).toBeNull()
    })

    it('should apply promo within valid date range', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const promo = {
        ...basePromo,
        discount_percent: 20,
        valid_from: yesterday.toISOString(),
        valid_until: tomorrow.toISOString(),
      }

      const result = calcPromo(promo, 10000)
      expect(result.discountAmount).toBe(2000)
      expect(result.appliedPromo?.code).toBe('SAVE20')
    })

    it('should not apply promo when usage limit is reached', () => {
      const promo = {
        ...basePromo,
        discount_percent: 20,
        usage_limit: 10,
        used_count: 10,
      }

      const result = calcPromo(promo, 10000)
      expect(result.discountAmount).toBe(0)
      expect(result.appliedPromo).toBeNull()
    })

    it('should apply promo when usage limit is not reached', () => {
      const promo = {
        ...basePromo,
        discount_percent: 20,
        usage_limit: 10,
        used_count: 5,
      }

      const result = calcPromo(promo, 10000)
      expect(result.discountAmount).toBe(2000)
      expect(result.appliedPromo?.code).toBe('SAVE20')
    })

    it('should prefer percentage discount over fixed amount', () => {
      const promo = {
        ...basePromo,
        discount_percent: 20,
        discount_amount: 1000,
      }

      const result = calcPromo(promo, 10000)
      expect(result.discountAmount).toBe(2000) // Uses percentage, not fixed
    })

    it('should return 0 discount when promo has no discount values', () => {
      const promo = {
        ...basePromo,
        discount_percent: null,
        discount_amount: null,
      }

      const result = calcPromo(promo, 10000)
      expect(result.discountAmount).toBe(0)
    })
  })

  describe('allocateParticipantsToTiers', () => {
    const NOW = new Date('2025-06-15T12:00:00Z')

    // Tier actif du 1er au 30 juin
    const activeTier = {
      id: 'tier-active',
      discount_percentage: 20,
      available_from: '2025-06-01T00:00:00Z',
      available_until: '2025-06-30T00:00:00Z',
      display_order: 1,
      max_registrations: null,
    }

    // Tier futur en juillet
    const futureTier = {
      id: 'tier-future',
      discount_percentage: 0,
      available_from: '2025-07-01T00:00:00Z',
      available_until: '2025-07-31T00:00:00Z',
      display_order: 2,
      max_registrations: null,
    }

    it('returns empty when tiers is null', () => {
      const result = allocateParticipantsToTiers(null, {}, 3, NOW)
      expect(result.allocations).toEqual([])
      expect(result.remaining).toBe(3)
      expect(result.activeTierIndex).toBeNull()
    })

    it('returns empty when tiers array is empty', () => {
      const result = allocateParticipantsToTiers([], {}, 3, NOW)
      expect(result.allocations).toEqual([])
      expect(result.remaining).toBe(3)
      expect(result.activeTierIndex).toBeNull()
    })

    it('returns empty when totalParticipants is 0', () => {
      const result = allocateParticipantsToTiers([activeTier], {}, 0, NOW)
      expect(result.allocations).toEqual([])
      expect(result.remaining).toBe(0)
      expect(result.activeTierIndex).toBeNull()
    })

    it('returns empty when no tier is active at the given date', () => {
      const pastNow = new Date('2024-01-01T12:00:00Z')
      const result = allocateParticipantsToTiers([activeTier], {}, 3, pastNow)
      expect(result.allocations).toEqual([])
      expect(result.remaining).toBe(3)
      expect(result.activeTierIndex).toBeNull()
    })

    it('allocates all participants to active unlimited tier', () => {
      const result = allocateParticipantsToTiers([activeTier], {}, 5, NOW)
      expect(result.allocations).toHaveLength(1)
      expect(result.allocations[0].tier.id).toBe('tier-active')
      expect(result.allocations[0].quantity).toBe(5)
      expect(result.remaining).toBe(0)
    })

    it('respects max_registrations on active tier', () => {
      const cappedTier = { ...activeTier, max_registrations: 3 }
      const result = allocateParticipantsToTiers([cappedTier], {}, 5, NOW)
      expect(result.allocations).toHaveLength(1)
      expect(result.allocations[0].quantity).toBe(3)
      expect(result.remaining).toBe(2)
    })

    it('accounts for already used slots (countsByTierId)', () => {
      const cappedTier = { ...activeTier, max_registrations: 5 }
      const counts = { 'tier-active': 3 } // 3 already used, 2 left
      const result = allocateParticipantsToTiers([cappedTier], counts, 5, NOW)
      expect(result.allocations[0].quantity).toBe(2)
      expect(result.remaining).toBe(3)
    })

    it('overflows to next tier when active tier is full', () => {
      const cappedActive = { ...activeTier, max_registrations: 2 }
      const result = allocateParticipantsToTiers([cappedActive, futureTier], {}, 5, NOW)
      expect(result.allocations).toHaveLength(2)
      expect(result.allocations[0].tier.id).toBe('tier-active')
      expect(result.allocations[0].quantity).toBe(2)
      expect(result.allocations[1].tier.id).toBe('tier-future')
      expect(result.allocations[1].quantity).toBe(3)
      expect(result.remaining).toBe(0)
    })

    it('skips a tier that has no available spots', () => {
      const fullTier = { ...activeTier, max_registrations: 3 }
      const counts = { 'tier-active': 3 } // tier completement plein
      const result = allocateParticipantsToTiers([fullTier, futureTier], counts, 2, NOW)
      expect(result.allocations).toHaveLength(1)
      expect(result.allocations[0].tier.id).toBe('tier-future')
      expect(result.allocations[0].quantity).toBe(2)
    })

    it('returns remaining when all tiers are at capacity', () => {
      const fullActive = { ...activeTier, max_registrations: 2 }
      const fullFuture = { ...futureTier, max_registrations: 1 }
      const counts = { 'tier-active': 2, 'tier-future': 1 }
      const result = allocateParticipantsToTiers([fullActive, fullFuture], counts, 5, NOW)
      expect(result.allocations).toHaveLength(0)
      expect(result.remaining).toBe(5)
    })

    it('sorts tiers by display_order before allocating', () => {
      // On inverse l'ordre pour vérifier que le tri est bien appliqué
      const tierOrderA = { ...futureTier, id: 'tier-A', display_order: 1, available_from: '2025-06-01T00:00:00Z', available_until: '2025-06-20T00:00:00Z', max_registrations: 2 }
      const tierOrderB = { ...futureTier, id: 'tier-B', display_order: 2, available_from: '2025-06-10T00:00:00Z', available_until: '2025-06-30T00:00:00Z', max_registrations: null }
      // tierOrderA est actif (NOW = 15 juin, dans la plage), tierOrderB aussi mais display_order = 2
      const result = allocateParticipantsToTiers([tierOrderB, tierOrderA], {}, 5, NOW)
      expect(result.allocations[0].tier.id).toBe('tier-A')
      expect(result.allocations[0].quantity).toBe(2)
      expect(result.allocations[1].tier.id).toBe('tier-B')
      expect(result.allocations[1].quantity).toBe(3)
    })
  })

  describe('expandTierAllocations', () => {
    it('returns empty array for empty allocations', () => {
      expect(expandTierAllocations([])).toEqual([])
    })

    it('expands a single allocation of quantity 1', () => {
      const tier = { id: 'tier-1', discount_percentage: 0, available_from: null, available_until: null }
      const result = expandTierAllocations([{ tier, quantity: 1 }])
      expect(result).toEqual(['tier-1'])
    })

    it('expands a single allocation of quantity 3', () => {
      const tier = { id: 'tier-1', discount_percentage: 0, available_from: null, available_until: null }
      const result = expandTierAllocations([{ tier, quantity: 3 }])
      expect(result).toEqual(['tier-1', 'tier-1', 'tier-1'])
    })

    it('expands multiple allocations in order', () => {
      const tierA = { id: 'tier-A', discount_percentage: 20, available_from: null, available_until: null }
      const tierB = { id: 'tier-B', discount_percentage: 0, available_from: null, available_until: null }
      const result = expandTierAllocations([
        { tier: tierA, quantity: 2 },
        { tier: tierB, quantity: 3 },
      ])
      expect(result).toEqual(['tier-A', 'tier-A', 'tier-B', 'tier-B', 'tier-B'])
    })

    it('total length matches sum of all quantities', () => {
      const tier = { id: 'tier-1', discount_percentage: 0, available_from: null, available_until: null }
      const result = expandTierAllocations([
        { tier, quantity: 4 },
        { tier, quantity: 6 },
      ])
      expect(result).toHaveLength(10)
    })
  })
})
