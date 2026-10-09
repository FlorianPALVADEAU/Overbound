import { describe, expect, it } from 'vitest'
import {
  allocatePaidTicketPrices,
  getFlexibleRefundDeadline,
  getFlexibleRefundEligibility,
  parseNumberList,
  serializeNumberList,
  type FlexibleRefundSubject,
} from './flexibleTicket'

describe('allocatePaidTicketPrices', () => {
  it('returns unit prices untouched without discount', () => {
    expect(allocatePaidTicketPrices([4500, 5500], 0)).toEqual([4500, 5500])
  })

  it('splits the discount in proportion and keeps the exact total', () => {
    const prices = allocatePaidTicketPrices([4500, 5500], 1000)
    expect(prices).toEqual([4050, 4950])
    expect(prices.reduce((a, b) => a + b, 0)).toBe(9000)
  })

  it('distributes rounding leftovers without losing a cent', () => {
    const prices = allocatePaidTicketPrices([3333, 3333, 3334], 1001)
    expect(prices.reduce((a, b) => a + b, 0)).toBe(10000 - 1001)
  })

  it('caps the discount at the subtotal', () => {
    expect(allocatePaidTicketPrices([1000], 5000)).toEqual([0])
  })
})

describe('number lists', () => {
  it('round-trips and ignores garbage', () => {
    expect(parseNumberList(serializeNumberList([0, 2, 5]))).toEqual([0, 2, 5])
    expect(parseNumberList('1, x, -2, 3')).toEqual([1, 3])
    expect(parseNumberList(undefined)).toEqual([])
  })
})

describe('getFlexibleRefundEligibility', () => {
  const event = '2027-09-12T08:00:00Z'
  const base: FlexibleRefundSubject = {
    flexible_refund: true,
    paid_ticket_cents: 5500,
    cancelled_at: null,
    checked_in: false,
    user_id: 'buyer',
    guarantor_user_id: null,
    order_user_id: 'buyer',
    event_date: event,
  }
  const before = new Date('2027-09-01T10:00:00Z')

  it('lets the buyer cancel a flexible bib before J-7 for the ticket price', () => {
    const result = getFlexibleRefundEligibility(base, 'buyer', before)
    expect(result).toMatchObject({ eligible: true, amountCents: 5500 })
  })

  it('closes exactly 7 days before the event', () => {
    const deadline = getFlexibleRefundDeadline(event)!
    expect(getFlexibleRefundEligibility(base, 'buyer', deadline).eligible).toBe(true)
    expect(getFlexibleRefundEligibility(base, 'buyer', new Date(deadline.getTime() + 1))).toEqual({
      eligible: false,
      reason: 'DEADLINE_PASSED',
    })
  })

  it.each([
    [{ flexible_refund: false }, 'NOT_FLEXIBLE'],
    [{ cancelled_at: '2027-08-01T00:00:00Z' }, 'ALREADY_CANCELLED'],
    [{ checked_in: true }, 'CHECKED_IN'],
    [{ guarantor_user_id: 'buyer', user_id: 'friend' }, 'TRANSFERRED'],
    [{ order_user_id: 'someone-else' }, 'NOT_BUYER'],
    [{ paid_ticket_cents: 0 }, 'NOTHING_PAID'],
  ] as const)('refuses %o with %s', (patch, reason) => {
    expect(getFlexibleRefundEligibility({ ...base, ...patch }, 'buyer', before)).toEqual({ eligible: false, reason })
  })
})
