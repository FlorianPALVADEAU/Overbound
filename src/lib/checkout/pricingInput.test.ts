import { describe, expect, it } from 'vitest'
import { computeOrderPricing } from '@/lib/orderPricing'
import { buildCheckoutPricingInput, type CheckoutPricingState } from './pricingInput'

const state = (overrides: Partial<CheckoutPricingState> = {}): CheckoutPricingState => ({
  ticketSlots: ['open', 'open'],
  flexibleBySlot: [true],
  companionBySlot: [],
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

  it('adds the OPEN companion of a RANKED bib, priced from the ticket contract, with a slot not yet filled left out', () => {
    const rankedWithOption = {
      id: 'ranked',
      name: 'Fury RANKED',
      final_price_cents: 7000,
      operations_config: {
        open_companion: { ticket_id: 'open', price_cents: 2900, ranked_max_duration_minutes: 230, min_gap_minutes: 20 },
      },
    }
    const input = buildCheckoutPricingInput(
      state({
        ticketSlots: ['ranked', 'ranked'],
        flexibleBySlot: [],
        companionBySlot: [true],
        tickets: [rankedWithOption],
        upsells: [],
        selectedUpsells: {},
        appliedPromos: [],
      }),
    )
    expect(input.participants.map((participant) => participant.companion)).toEqual([true, false])
    const result = computeOrderPricing(input)
    if (!result.ok) throw new Error('priced order expected')
    expect(result.value.companionTotal).toBe(2900)
  })
})
