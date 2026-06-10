import { describe, expect, it } from 'vitest'
import {
  buildOrderSummaries,
  computeUniquePaidRevenueCents,
  countRegistrationsByOrder,
} from './orderRevenue'

describe('countRegistrationsByOrder', () => {
  it('counts registrations per order and ignores null order IDs', () => {
    const counts = countRegistrationsByOrder([
      { order_id: 'o1' },
      { order_id: 'o1' },
      { order_id: 'o2' },
      { order_id: null },
      {},
    ])

    expect(counts.get('o1')).toBe(2)
    expect(counts.get('o2')).toBe(1)
    expect(counts.has('')).toBe(false)
  })
})

describe('buildOrderSummaries', () => {
  it('computes amount_per_registration for shared orders', () => {
    const summaries = buildOrderSummaries({
      orders: [
        { id: 'o1', amount_total: 10000, currency: 'eur', status: 'paid' },
        { id: 'o2', amount_total: 7500, currency: 'eur', status: 'paid' },
      ],
      registrationsByOrder: new Map([
        ['o1', 5],
        ['o2', 1],
      ]),
    })

    expect(summaries.get('o1')).toMatchObject({
      amount_total: 10000,
      amount_per_registration: 2000,
      registrations_count: 5,
    })
    expect(summaries.get('o2')).toMatchObject({
      amount_total: 7500,
      amount_per_registration: 7500,
      registrations_count: 1,
    })
  })

  it('defaults registrations_count to 1 when no registration rows are found', () => {
    const summaries = buildOrderSummaries({
      orders: [{ id: 'o1', amount_total: 3499, currency: 'eur', status: 'paid' }],
      registrationsByOrder: new Map(),
    })

    expect(summaries.get('o1')).toMatchObject({
      registrations_count: 1,
      amount_per_registration: 3499,
    })
  })

  it('handles missing amount_total without crashing', () => {
    const summaries = buildOrderSummaries({
      orders: [{ id: 'o1', amount_total: null, currency: 'eur', status: 'paid' }],
      registrationsByOrder: new Map([['o1', 3]]),
    })

    expect(summaries.get('o1')).toMatchObject({
      amount_total: null,
      amount_per_registration: null,
      registrations_count: 3,
    })
  })
})

describe('computeUniquePaidRevenueCents', () => {
  it('sums only paid orders once and keeps first currency', () => {
    const revenue = computeUniquePaidRevenueCents([
      { id: 'o1', amount_total: 10000, currency: 'eur', status: 'paid' },
      { id: 'o2', amount_total: 7500, currency: 'eur', status: 'paid' },
      { id: 'o3', amount_total: 9999, currency: 'eur', status: 'pending' },
    ])

    expect(revenue).toEqual({
      totalRevenueCents: 17500,
      revenueCurrency: 'eur',
    })
  })

  it('returns zero when there are no paid orders', () => {
    const revenue = computeUniquePaidRevenueCents([
      { id: 'o1', amount_total: 10000, currency: 'eur', status: 'pending' },
      { id: 'o2', amount_total: null, currency: 'eur', status: 'paid' },
    ])

    expect(revenue).toEqual({
      totalRevenueCents: 0,
      revenueCurrency: null,
    })
  })
})

