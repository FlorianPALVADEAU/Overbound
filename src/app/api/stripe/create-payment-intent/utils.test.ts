import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCurrentTicketPriceFromRow,
  getTicketSubtotal,
  getUpsellSubtotal,
  calcPromo,
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
})
