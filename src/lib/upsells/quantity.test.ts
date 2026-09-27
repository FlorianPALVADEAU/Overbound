import { describe, expect, it } from 'vitest'
import { getUpsellQuantityLimit, validateUpsellQuantities } from './quantity'

describe('upsell quantity rules', () => {
  it('requires a ticket for every upsell', () => {
    expect(getUpsellQuantityLimit('other', 0)).toBe(0)
  })

  it('limits photos and t-shirts to one per ticket, and patches to two', () => {
    expect(getUpsellQuantityLimit('photos', 3)).toBe(3)
    expect(getUpsellQuantityLimit('tshirt', 3)).toBe(3)
    expect(getUpsellQuantityLimit('patch', 3)).toBe(6)
  })

  it('rejects a selection over its per-ticket limit', () => {
    const products = new Map([['patch-1', { id: 'patch-1', type: 'patch' as const }]])
    expect(validateUpsellQuantities([{ upsellId: 'patch-1', quantity: 3 }], products, 1)).toContain('maximale')
  })
})
