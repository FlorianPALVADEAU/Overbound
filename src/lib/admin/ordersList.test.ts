import { describe, expect, it } from 'vitest'
import { decodeOrdersCursor, encodeOrdersCursor, ordersQuerySchema, summarizeOrders, type OrderRow } from './ordersList'

const ID = '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'

const order = (patch: Partial<OrderRow> = {}): OrderRow => ({
  id: 'order-1',
  email: 'ana@example.com',
  status: 'paid',
  amount_total: 11000,
  currency: 'EUR',
  provider: 'stripe',
  provider_order_id: 'pi_123',
  invoice_url: null,
  created_at: '2027-01-02T10:00:00Z',
  ...patch,
})

describe('orders cursor', () => {
  it('round-trips', () => {
    const cursor = { createdAt: '2027-01-02T10:00:00.123456+00:00', id: ID }
    expect(decodeOrdersCursor(encodeOrdersCursor(cursor))).toEqual(cursor)
  })

  it('rejects garbage and invalid dates', () => {
    expect(() => decodeOrdersCursor('nope')).toThrow('Cursor de pagination invalide')
    expect(() => decodeOrdersCursor(encodeOrdersCursor({ createdAt: 'not a date', id: ID }))).toThrow('Cursor de pagination invalide')
  })
})

describe('ordersQuerySchema', () => {
  it('defaults the page size and rejects unknown statuses', () => {
    expect(ordersQuerySchema.parse({}).limit).toBe(50)
    expect(ordersQuerySchema.safeParse({ status: 'weird' }).success).toBe(false)
    expect(ordersQuerySchema.safeParse({ limit: '5' }).success).toBe(false)
  })
})

describe('summarizeOrders', () => {
  const registrations = [
    { id: 'r1', order_id: 'order-1', cancelled_at: null, event: { title: 'Overbound' } },
    { id: 'r2', order_id: 'order-1', cancelled_at: '2027-02-01T00:00:00Z', event: [{ title: 'Overbound' }] },
  ]

  it('counts bibs, cancelled bibs and distinct events per order', () => {
    const [item] = summarizeOrders({ orders: [order()], registrations, refunds: [] })
    expect(item).toMatchObject({ registrations: 2, cancelledRegistrations: 1, events: ['Overbound'] })
  })

  it('adds the refunds of the order’s bibs', () => {
    const [item] = summarizeOrders({
      orders: [order()],
      registrations,
      refunds: [{ registration_id: 'r2', amount_cents: 5500 }, { registration_id: 'unrelated', amount_cents: 999 }],
    })
    expect(item.refundedCents).toBe(5500)
  })

  it('links a Stripe payment intent to its dashboard and allows a receipt for paid orders', () => {
    const [item] = summarizeOrders({ orders: [order()], registrations: [], refunds: [] })
    expect(item.stripeUrl).toBe('https://dashboard.stripe.com/payments/pi_123')
    expect(item.canResendReceipt).toBe(true)
    expect(item.currency).toBe('eur')
  })

  it('offers neither a Stripe link nor a receipt for a free or internal order', () => {
    const [item] = summarizeOrders({ orders: [order({ provider: 'internal', provider_order_id: 'free_abc' })], registrations: [], refunds: [] })
    expect(item).toMatchObject({ stripeUrl: null, canResendReceipt: false })
  })

  it('offers no receipt for an order that is not paid', () => {
    const [item] = summarizeOrders({ orders: [order({ status: 'pending' })], registrations: [], refunds: [] })
    expect(item.canResendReceipt).toBe(false)
  })
})
