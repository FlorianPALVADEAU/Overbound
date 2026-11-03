import { describe, expect, it } from 'vitest'
import { operationsConfigOf, ticketUpdateSchema } from './ticketInput'

const valid = { event_id: 'event-1', name: 'RANKED', price: 7000, max_participants: 100 }

describe('ticketUpdateSchema', () => {
  it('accepts the form payload and normalises an empty race to null', () => {
    const parsed = ticketUpdateSchema.parse({ ...valid, race_id: '', description: null, operations_config: { departure_mode: 'wave' } })
    expect(parsed.race_id).toBeNull()
    expect(parsed.price).toBe(7000)
    expect(operationsConfigOf(parsed)).toEqual({ departure_mode: 'wave' })
  })

  it('accepts a numeric string for the price and the capacity', () => {
    const parsed = ticketUpdateSchema.parse({ ...valid, price: '4500', max_participants: '50' })
    expect(parsed.price).toBe(4500)
    expect(parsed.max_participants).toBe(50)
  })

  it('refuses a missing name, a negative or fractional price, and a missing event', () => {
    expect(ticketUpdateSchema.safeParse({ ...valid, name: '  ' }).success).toBe(false)
    expect(ticketUpdateSchema.safeParse({ ...valid, price: -1 }).success).toBe(false)
    expect(ticketUpdateSchema.safeParse({ ...valid, price: 12.5 }).success).toBe(false)
    expect(ticketUpdateSchema.safeParse({ ...valid, event_id: '' }).success).toBe(false)
    expect(ticketUpdateSchema.safeParse({ name: 'x', price: 1 }).success).toBe(false)
  })

  it('refuses a price that is not a number instead of storing NaN', () => {
    expect(ticketUpdateSchema.safeParse({ ...valid, price: 'abc' }).success).toBe(false)
  })
})
