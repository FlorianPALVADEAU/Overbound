import { describe, expect, it } from 'vitest'
import { createBalance, deduct, remainingFor } from './balance'

describe('RemainingBalance', () => {
  it('takes a deduction off its target only', () => {
    const balance = deduct(createBalance(5000, { tshirt: 2000 }), { kind: 'upsell', upsellId: 'tshirt' }, 500)
    expect(remainingFor(balance, { kind: 'upsell', upsellId: 'tshirt' })).toBe(1500)
    expect(remainingFor(balance, { kind: 'tickets' })).toBe(5000)
  })

  it('never goes below zero', () => {
    const balance = deduct(createBalance(1000, {}), { kind: 'tickets' }, 4000)
    expect(balance.tickets).toBe(0)
  })

  it('reads an upsell that is not in the cart as nothing left to pay', () => {
    expect(remainingFor(createBalance(0, {}), { kind: 'upsell', upsellId: 'medal' })).toBe(0)
  })

  it('does not mutate the previous balance', () => {
    const before = createBalance(1000, {})
    deduct(before, { kind: 'tickets' }, 400)
    expect(before.tickets).toBe(1000)
  })
})
