import { describe, expect, it } from 'vitest'
import type { EventPriceTier } from '@/types/EventPriceTier'
import { checkoutNudges } from './checkoutNudges'

const tier = (overrides: Partial<EventPriceTier>): EventPriceTier => ({
  id: 't', event_id: 'e', name: 'Early', discount_percentage: 20, available_from: '2026-01-01', available_until: null,
  display_order: 1, max_registrations: null, created_at: '', updated_at: '', ...overrides,
})
const NOW = new Date('2026-12-01T10:00:00Z')

describe('checkoutNudges', () => {
  it('invites to add a bib to reach the next group tier of a format already in the order', () => {
    expect(checkoutNudges({ formatCounts: { open: 1, ranked: 0 }, sellingTier: null, tiers: [], now: NOW })).toEqual([
      'Ajoute 1 billet OPEN : −10 % sur chacun des 2 billets OPEN.',
    ])
    expect(checkoutNudges({ formatCounts: { open: 3, ranked: 0 }, sellingTier: null, tiers: [], now: NOW })[0]).toContain('Ajoute 3 billets OPEN : −20 %')
  })

  it('says nothing at the top group tier or for a format not ordered', () => {
    expect(checkoutNudges({ formatCounts: { open: 6, ranked: 0 }, sellingTier: null, tiers: [], now: NOW })).toEqual([])
  })

  it('announces the end of the tier only when the price goes up after it', () => {
    const selling = tier({ available_until: '2026-12-15' })
    const dearer = tier({ id: 'n', name: 'Standard', discount_percentage: 0, available_from: '2026-12-15' })
    expect(checkoutNudges({ formatCounts: { open: 0, ranked: 0 }, sellingTier: selling, tiers: [selling, dearer], now: NOW })[0]).toContain('jusqu\'au 15 décembre')
    const cheaper = tier({ id: 'n', discount_percentage: 40, available_from: '2026-12-15' })
    expect(checkoutNudges({ formatCounts: { open: 0, ranked: 0 }, sellingTier: selling, tiers: [selling, cheaper], now: NOW })).toEqual([])
  })

  it('never invents a deadline', () => {
    expect(checkoutNudges({ formatCounts: { open: 0, ranked: 0 }, sellingTier: tier({}), tiers: [], now: NOW })).toEqual([])
  })
})
