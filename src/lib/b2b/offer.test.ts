import { describe, expect, it } from 'vitest'
import { buildDiscountLadder, describeTicketRange, quoteTeam } from './offer'

describe('buildDiscountLadder', () => {
  it('matches the FDR-0019 prices for a 59.99 EUR Open and a 69.99 EUR Ranked ticket', () => {
    const ladder = buildDiscountLadder({ open: 5999, ranked: 6999 })
    expect(ladder.map((row) => [row.minTickets, row.maxTickets, row.percent, row.openUnitCents, row.rankedUnitCents])).toEqual([
      [2, 2, 10, 5399, 6299],
      [3, 5, 15, 5099, 5949],
      [6, null, 20, 4799, 5599],
    ])
  })
})

describe('describeTicketRange', () => {
  it('words a single quantity, a range and an open end', () => {
    expect(describeTicketRange({ minTickets: 2, maxTickets: 2 })).toBe('2')
    expect(describeTicketRange({ minTickets: 3, maxTickets: 5 })).toBe('3 à 5')
    expect(describeTicketRange({ minTickets: 6, maxTickets: null })).toBe('6 et plus')
  })
})

describe('quoteTeam', () => {
  it('discounts a team of 10 by 20 %', () => {
    expect(quoteTeam(10, 5999)).toEqual({ tickets: 10, percent: 20, totalCents: 47990, fullPriceCents: 59990 })
  })

  it('charges full price for a single ticket', () => {
    expect(quoteTeam(1, 5999)).toEqual({ tickets: 1, percent: 0, totalCents: 5999, fullPriceCents: 5999 })
  })
})
