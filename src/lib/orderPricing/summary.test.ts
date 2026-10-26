import { describe, expect, it } from 'vitest'
import { computeOrderPricing } from './computeOrderPricing'
import { groupTicketLines, toPricingSummary } from './summary'
import { order, participantsOn, percentCode, tier } from './testFixtures'

describe('toPricingSummary', () => {
  it('itemises each discount with its target', () => {
    const result = computeOrderPricing(
      order({
        upsellLines: [{ upsellId: 'tshirt', quantity: 1 }],
        promos: [percentCode('SUMMER', 10), percentCode('TEE50', 50, { targetUpsellId: 'tshirt' })],
      }),
    )
    if (!result.ok) throw new Error('priced order expected')
    expect(toPricingSummary(result.value, 'eur')).toEqual({
      ticketTotal: 5000,
      ticketLines: [
        { ticketId: 'open', tierId: null, quantity: 1, participantIndexes: [0], amountCents: 5000, fullPriceCents: 5000 },
      ],
      upsellTotal: 2000,
      flexibleTotal: 0,
      discountAmount: 1500,
      discounts: [
        { code: 'SUMMER', amountCents: 500, upsellId: null },
        { code: 'TEE50', amountCents: 1000, upsellId: 'tshirt' },
      ],
      groupDiscount: { percent: 0, amountCents: 0, applied: false },
      totalDue: 5500,
      currency: 'eur',
    })
  })
})

describe('groupTicketLines', () => {
  it('splits one ticket in two lines when part of the order spills onto the next tier', () => {
    const result = computeOrderPricing(
      order({
        participants: participantsOn('open', 'ranked', 'open', 'open'),
        tiers: [tier({ maxRegistrations: 2 }), tier({ id: 'late', displayOrder: 2, discountPercentage: 0 })],
      }),
    )
    if (!result.ok) throw new Error('priced order expected')
    expect(groupTicketLines(result.value.participants).map((line) => [line.ticketId, line.quantity, line.participantIndexes])).toEqual([
      ['open', 1, [0]],
      ['ranked', 1, [1]],
      ['open', 2, [2, 3]],
    ])
  })
})
