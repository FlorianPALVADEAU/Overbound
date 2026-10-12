import { describe, expect, it } from 'vitest'
import { computeOrderPricing } from '@/lib/orderPricing'
import { buildCheckoutPricingInput, type CheckoutPricingState } from './pricingInput'

const state = (overrides: Partial<CheckoutPricingState> = {}): CheckoutPricingState => ({
  ticketSlots: ['open', 'open'],
  flexibleBySlot: [true],
  tickets: [{ id: 'open', name: 'Primal OPEN', final_price_cents: 5000 }],
  tiers: [],
  tierRegistrationCounts: {},
  upsells: [{ id: 'tshirt', price_cents: 2000 }],
  selectedUpsells: { tshirt: { quantity: 1 } },
  appliedPromos: [{ code: 'HALF', discount_percent: 50, discount_amount: null }],
  now: new Date('2026-06-01T12:00:00Z'),
  ...overrides,
})

describe('buildCheckoutPricingInput', () => {
  it('prices the checkout like the payment API would', () => {
    const result = computeOrderPricing(buildCheckoutPricingInput(state()))
    // 2 × 50 € -50 % + t-shirt 20 € + one flexible option 8,90 €
    expect(result.ok && result.value.totalDue).toBe(5000 + 2000 + 890)
  })

  it('treats a slot without participant yet as not flexible', () => {
    const input = buildCheckoutPricingInput(state({ flexibleBySlot: [] }))
    expect(input.participants.every((participant) => !participant.flexible)).toBe(true)
  })
})
