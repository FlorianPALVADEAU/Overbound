import { describe, expect, it } from 'vitest'
import { isPromoUsableOnEvent, type PromoRow } from './orderPromos'

const NOW = new Date('2026-06-01T12:00:00Z')
const row = (overrides: Partial<PromoRow> = {}): PromoRow => ({
  id: 'p',
  code: 'SUMMER',
  discount_percent: 10,
  discount_amount: null,
  currency: 'eur',
  is_active: true,
  valid_from: null,
  valid_until: null,
  usage_limit: null,
  used_count: 0,
  events: [],
  ...overrides,
})

describe('isPromoUsableOnEvent', () => {
  it('accepts an active code without limits', () => {
    expect(isPromoUsableOnEvent(row(), 'event', NOW)).toBe(true)
  })

  it('refuses an inactive, expired, exhausted or foreign code', () => {
    expect(isPromoUsableOnEvent(row({ is_active: false }), 'event', NOW)).toBe(false)
    expect(isPromoUsableOnEvent(row({ valid_until: '2026-05-01T00:00:00Z' }), 'event', NOW)).toBe(false)
    expect(isPromoUsableOnEvent(row({ usage_limit: 3, used_count: 3 }), 'event', NOW)).toBe(false)
    expect(isPromoUsableOnEvent(row({ events: [{ event_id: 'other' }] }), 'event', NOW)).toBe(false)
  })
})
