import { describe, expect, it } from 'vitest'
import { computeOrderPricing } from './computeOrderPricing'
import {
  amountCode,
  openTicket,
  order,
  participantsOn,
  percentCode,
  tier,
} from './testFixtures'
import type { OrderPricing, OrderPricingInput } from './types'

/**
 * Hand-computed orders. Prices: OPEN 50 €, RANKED 70 €, t-shirt 20 €, medal 8 €,
 * flexible option 8,90 €. Each expected total was worked out on paper first.
 */
const price = (input: OrderPricingInput): OrderPricing => {
  const result = computeOrderPricing(input)
  if (!result.ok) throw new Error(`Unexpected pricing error: ${result.error.kind}`)
  return result.value
}

const ambassador = (code: string, percent: number) => percentCode(code, percent, { isAmbassador: true })
const late = tier({ id: 'late', displayOrder: 2, discountPercentage: 0 })

describe('computeOrderPricing — tiers', () => {
  it('charges full price without tier', () => {
    expect(price(order()).totalDue).toBe(5000)
  })

  it('applies the active tier to every ticket, then the group discount on the tier price', () => {
    // 3 ranked at 70 €: tier -20 % → 56 €, then group -15 % → 47,60 € each
    expect(price(order({ participants: participantsOn('ranked', 'ranked', 'ranked'), tiers: [tier()] })).totalDue).toBe(14280)
  })

  it('charges the next tier for the participants that do not fit in the active one', () => {
    const pricing = price(
      order({
        participants: participantsOn('open', 'open', 'open'),
        tiers: [tier({ maxRegistrations: 10 }), late],
        tierRegistrationCounts: { early: 8 },
      }),
    )
    expect(pricing.participants.map((p) => p.unitPriceCents)).toEqual([4000, 4000, 5000])
    expect(pricing.tierAllocations).toEqual([
      { tierId: 'early', quantity: 2 },
      { tierId: 'late', quantity: 1 },
    ])
    // 4000 + 4000 + 5000, then 15 % group discount on each OPEN ticket: 3400 + 3400 + 4250
    expect(pricing.totalDue).toBe(11050)
  })

  it('refuses the order when every tier is full', () => {
    const result = computeOrderPricing(order({ tiers: [tier({ maxRegistrations: 1 })], tierRegistrationCounts: { early: 1 } }))
    expect(result).toEqual({ ok: false, error: { kind: 'TIERS_SOLD_OUT' } })
  })
})

describe('computeOrderPricing — ticket codes', () => {
  it('takes a percentage off the tickets', () => {
    expect(price(order({ participants: participantsOn('open', 'open'), promos: [percentCode('HALF', 50)] })).totalDue).toBe(5000)
  })

  it('takes a fixed amount off the tickets', () => {
    expect(price(order({ promos: [amountCode('TEN', 1000)] })).totalDue).toBe(4000)
  })

  it('never goes below zero with a fixed amount bigger than the order', () => {
    const cheap = order({ tickets: [openTicket({ finalPriceCents: 800 })], promos: [amountCode('TEN', 1000)] })
    expect(price(cheap).totalDue).toBe(0)
  })

  it('applies -50 % to what is left after a free OPEN ticket (2 tickets: 25 €)', () => {
    const pricing = price(
      order({
        participants: participantsOn('open', 'open'),
        promos: [ambassador('AMBHALF', 50), percentCode('FREEOPENTICKET', 100)],
      }),
    )
    expect(pricing.discounts.map((d) => [d.code, d.amountCents])).toEqual([
      ['FREEOPENTICKET', 5000],
      ['AMBHALF', 2500],
    ])
    expect(pricing.totalDue).toBe(2500)
  })

  it('makes a single-ticket order free with a free OPEN ticket and -50 %', () => {
    const pricing = price(order({ promos: [ambassador('AMBHALF', 50), percentCode('FREEOPENTICKET', 100)] }))
    expect(pricing.totalDue).toBe(0)
  })

  it('reports an OPEN ticket code on a RANKED-only order and charges full price', () => {
    const pricing = price(order({ participants: participantsOn('ranked'), promos: [percentCode('FREEOPENTICKET', 100)] }))
    expect(pricing.rejections).toEqual([{ code: 'FREEOPENTICKET', reason: 'OPEN_TICKET_CODE_WITHOUT_OPEN_TICKET' }])
    expect(pricing.totalDue).toBe(7000)
  })

  it('gives the OPEN ticket, not the RANKED one listed first', () => {
    const pricing = price(order({ participants: participantsOn('ranked', 'open'), promos: [percentCode('FREEOPENTICKET', 100)] }))
    expect(pricing.totalDue).toBe(7000)
  })

  it('gives exactly 30 % with LUOFF30 on a -20 % tier', () => {
    const pricing = price(order({ participants: participantsOn('open', 'open'), tiers: [tier()], promos: [percentCode('LUOFF30', 30)] }))
    expect(pricing.totalDue).toBe(7000)
  })

  it('applies WELCOME05 to what LUOFF30 left to pay', () => {
    const pricing = price(
      order({
        participants: participantsOn('open', 'open'),
        tiers: [tier()],
        promos: [percentCode('WELCOME05', 5), percentCode('LUOFF30', 30)],
      }),
    )
    expect(pricing.totalDue).toBe(6650)
  })

  it('keeps the first of two ticket codes and reports the second', () => {
    const pricing = price(order({ promos: [percentCode('SUMMER', 10), percentCode('WINTER', 20)] }))
    expect(pricing.rejections).toEqual([{ code: 'WINTER', reason: 'ONE_TICKET_CODE' }])
    expect(pricing.totalDue).toBe(4500)
  })
})

describe('computeOrderPricing — upsells and product codes', () => {
  it('adds upsells chosen for some participants only', () => {
    const pricing = price(
      order({
        participants: participantsOn('open', 'open', 'open'),
        upsellLines: [{ upsellId: 'tshirt', quantity: 1 }, { upsellId: 'medal', quantity: 2 }],
      }),
    )
    expect(pricing.upsellSubtotal).toBe(3600)
    // 3 × 50 € - 15 % group discount = 127,50 €, plus 36 € of upsells
    expect(pricing.totalDue).toBe(16350)
  })

  it('discounts the targeted upsell and the tickets separately', () => {
    const pricing = price(
      order({
        upsellLines: [{ upsellId: 'tshirt', quantity: 1 }],
        promos: [percentCode('SUMMER', 10), percentCode('TEE50', 50, { targetUpsellId: 'tshirt' })],
      }),
    )
    expect(pricing.ticketDiscountAmount).toBe(500)
    expect(pricing.upsellDiscountAmount).toBe(1000)
    expect(pricing.totalDue).toBe(5500)
  })

  it('gives nothing for a product code whose upsell is not in the cart', () => {
    const pricing = price(order({ promos: [percentCode('TEE50', 50, { targetUpsellId: 'tshirt' })] }))
    expect(pricing.discounts).toEqual([])
    expect(pricing.totalDue).toBe(5000)
  })

  it('can make an upsell free', () => {
    const pricing = price(
      order({ upsellLines: [{ upsellId: 'tshirt', quantity: 1 }], promos: [percentCode('FREETEE', 100, { targetUpsellId: 'tshirt' })] }),
    )
    expect(pricing.totalDue).toBe(5000)
  })
})

describe('computeOrderPricing — flexible option', () => {
  it('still charges the option on an otherwise free order', () => {
    const pricing = price(order({ participants: [{ ticketId: 'open', flexible: true }], promos: [percentCode('FREE', 100)] }))
    expect(pricing.totalDue).toBe(890)
  })

  it('never discounts the option', () => {
    const pricing = price(
      order({
        participants: [{ ticketId: 'open', flexible: true }, { ticketId: 'open', flexible: true }],
        promos: [percentCode('HALF', 50)],
      }),
    )
    expect(pricing.flexibleTotal).toBe(1780)
    expect(pricing.totalDue).toBe(6780)
  })
})

describe('computeOrderPricing — mixed orders', () => {
  it('prices 7 participants across two tiers, with an ambassador code, upsells and one flexible bib', () => {
    const pricing = price(
      order({
        participants: [
          ...participantsOn('open', 'open', 'ranked', 'open', 'ranked', 'open'),
          { ticketId: 'ranked', flexible: true },
        ],
        tiers: [tier({ maxRegistrations: 10 }), late],
        tierRegistrationCounts: { early: 5 },
        upsellLines: [{ upsellId: 'tshirt', quantity: 2 }],
        promos: [ambassador('AMB30', 30)],
      }),
    )
    // 7 tickets earn the 20 % group discount (7040 cents); the 30 % code is worth more, so it wins
    expect(pricing.ticketSubtotal).toBe(35200)
    expect(pricing.discountAmount).toBe(10560)
    expect(pricing.totalDue).toBe(29530)
  })

  it('spreads a rounded discount so bib prices add up to what was paid for tickets', () => {
    const pricing = price(
      order({
        tickets: [openTicket({ finalPriceCents: 3333 })],
        participants: participantsOn('open', 'open', 'open'),
        promos: [percentCode('THIRD', 33)],
      }),
    )
    const paid = pricing.participants.reduce((sum, p) => sum + p.paidPriceCents, 0)
    expect(pricing.ticketDiscountAmount).toBe(3300)
    expect(paid).toBe(9999 - 3300)
  })
})
