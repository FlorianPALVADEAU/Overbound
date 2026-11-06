import { describe, expect, it } from 'vitest'
import { computeOrderPricing } from './computeOrderPricing'
import { computeGroupDiscount, groupDiscountPercent } from './groupDiscount'
import type { TierPricedParticipant } from './participantPricing'
import { amountCode, order, participantsOn, percentCode } from './testFixtures'
import type { OrderPricing, OrderPricingInput } from './types'

/** Prices: OPEN 50 €, RANKED 70 €. Group tiers per format: 2 → -10 %, 3 to 5 → -15 %, 6+ → -20 %. Formats never count together. */
const price = (input: OrderPricingInput): OrderPricing => {
  const result = computeOrderPricing(input)
  if (!result.ok) throw new Error(`Unexpected pricing error: ${result.error.kind}`)
  return result.value
}

const opens = (count: number) => participantsOn(...Array<string>(count).fill('open'))
const ranked = (count: number) => participantsOn(...Array<string>(count).fill('ranked'))
const ambassador = (code: string, percent: number) => percentCode(code, percent, { isAmbassador: true })

const participant = (overrides: Partial<TierPricedParticipant> = {}): TierPricedParticipant => ({
  ticketId: 'open',
  tierId: null,
  basePriceCents: 5999,
  unitPriceCents: 5999,
  isOpenFormat: true,
  flexible: false,
  ...overrides,
})

const rankedParticipant = (overrides: Partial<TierPricedParticipant> = {}) =>
  participant({ ticketId: 'ranked', isOpenFormat: false, basePriceCents: 6999, unitPriceCents: 6999, ...overrides })

describe('groupDiscountPercent', () => {
  it.each([
    [0, 0],
    [1, 0],
    [2, 10],
    [3, 15],
    [5, 15],
    [6, 20],
    [40, 20],
  ])('gives %i tickets of one format a %i %% discount', (count, percent) => {
    expect(groupDiscountPercent(count)).toBe(percent)
  })
})

describe('computeGroupDiscount', () => {
  it('rounds each ticket to the cent like a tier does', () => {
    const duo = computeGroupDiscount([participant(), participant()])
    expect(duo.amountCents).toBe(2 * (5999 - 5399))
    expect(duo.lines).toEqual([{ format: 'open', ticketCount: 2, percent: 10, amountCents: 2 * 600 }])
  })

  it('gives no discount to one OPEN and one RANKED ticket', () => {
    const mixed = computeGroupDiscount([participant(), rankedParticipant()])
    expect(mixed).toEqual({ percentByFormat: { open: 0, ranked: 0 }, lines: [], amountCents: 0 })
  })

  it('counts the OPEN tickets among themselves and leaves the lone RANKED ticket full price', () => {
    const mixed = computeGroupDiscount([participant(), participant(), rankedParticipant()])
    expect(mixed.percentByFormat).toEqual({ open: 10, ranked: 0 })
    expect(mixed.lines).toEqual([{ format: 'open', ticketCount: 2, percent: 10, amountCents: 2 * 600 }])
    expect(mixed.amountCents).toBe(1200)
  })

  it('gives a ranked-only duo the same tiers', () => {
    const duo = computeGroupDiscount([rankedParticipant(), rankedParticipant()])
    expect(duo.percentByFormat).toEqual({ open: 0, ranked: 10 })
    expect(duo.amountCents).toBe(2 * 700)
  })

  it('gives each format its own tier when both reach a threshold', () => {
    const team = computeGroupDiscount([
      participant(),
      participant(),
      participant(),
      rankedParticipant(),
      rankedParticipant(),
      rankedParticipant(),
      rankedParticipant(),
      rankedParticipant(),
      rankedParticipant(),
    ])
    expect(team.percentByFormat).toEqual({ open: 15, ranked: 20 })
    expect(team.lines.map((line) => [line.format, line.ticketCount, line.percent])).toEqual([
      ['open', 3, 15],
      ['ranked', 6, 20],
    ])
  })
})

describe('computeOrderPricing — group discount', () => {
  it('charges full price to a single open ticket', () => {
    expect(price(order()).totalDue).toBe(5000)
  })

  it('takes 10 % off each ticket of an OPEN duo', () => {
    expect(price(order({ participants: opens(2) })).totalDue).toBe(9000)
  })

  it('takes 15 % off 3 OPEN tickets and 20 % off 6 OPEN tickets', () => {
    expect(price(order({ participants: opens(3) })).totalDue).toBe(12750)
    expect(price(order({ participants: opens(6) })).totalDue).toBe(24000)
  })

  it('gives no discount to one OPEN and one RANKED ticket', () => {
    const pricing = price(order({ participants: participantsOn('open', 'ranked') }))
    expect(pricing.participants.map((p) => p.paidPriceCents)).toEqual([5000, 7000])
    expect(pricing.groupDiscount.applied).toBe(false)
    expect(pricing.totalDue).toBe(12000)
  })

  it('discounts only the two OPEN tickets of a 2 OPEN + 1 RANKED order', () => {
    const pricing = price(order({ participants: participantsOn('open', 'open', 'ranked') }))
    expect(pricing.participants.map((p) => p.paidPriceCents)).toEqual([4500, 4500, 7000])
    expect(pricing.totalDue).toBe(4500 + 4500 + 7000)
  })

  it('discounts a RANKED duo by 10 %', () => {
    expect(price(order({ participants: ranked(2) })).totalDue).toBe(2 * 6300)
  })

  it('gives 10 % to 2 OPEN tickets and 15 % to 4 RANKED tickets, not one total rate', () => {
    const pricing = price(order({ participants: [...opens(2), ...ranked(4)] }))
    expect(pricing.participants.map((p) => p.paidPriceCents)).toEqual([4500, 4500, 5950, 5950, 5950, 5950])
    expect(pricing.groupDiscount.lines.map((line) => [line.format, line.percent])).toEqual([
      ['open', 10],
      ['ranked', 15],
    ])
    expect(pricing.totalDue).toBe(9000 + 23800)
  })

  it('never discounts the flexible option', () => {
    const pricing = price(order({ participants: [{ ticketId: 'open', flexible: true }, { ticketId: 'open', flexible: false }] }))
    expect(pricing.totalDue).toBe(9000 + 890)
  })
})

describe('computeOrderPricing — group discount against codes: the best one wins, never both', () => {
  it('keeps the code when it gives more than the group discount', () => {
    const pricing = price(order({ participants: opens(6), promos: [ambassador('AMB30', 30)] }))
    expect(pricing.totalDue).toBe(21000)
    expect(pricing.discounts).toEqual([
      { code: 'AMB30', target: { kind: 'tickets' }, amountCents: 9000, isAmbassador: true },
    ])
    expect(pricing.groupDiscount).toEqual({
      lines: [{ format: 'open', ticketCount: 6, percent: 20, amountCents: 6000 }],
      amountCents: 6000,
      applied: false,
    })
  })

  it('keeps the group discount when the code gives less, and still records the code', () => {
    const pricing = price(order({ participants: opens(6), promos: [ambassador('AMB10', 10)] }))
    expect(pricing.totalDue).toBe(24000)
    expect(pricing.discounts).toEqual([
      { code: 'AMB10', target: { kind: 'tickets' }, amountCents: 0, isAmbassador: true },
    ])
    expect(pricing.groupDiscount.applied).toBe(true)
    expect(pricing.ticketDiscountAmount).toBe(6000)
  })

  it('gives the tie to the group discount and still records the code', () => {
    const pricing = price(order({ participants: opens(2), promos: [amountCode('AMB10E', 1000, { isAmbassador: true })] }))
    expect(pricing.totalDue).toBe(9000)
    expect(pricing.discounts.map((d) => [d.code, d.amountCents])).toEqual([['AMB10E', 0]])
  })

  it('does not touch a code on an upsell', () => {
    const pricing = price(
      order({
        participants: opens(2),
        upsellLines: [{ upsellId: 'tshirt', quantity: 1 }],
        promos: [percentCode('TEE50', 50, { targetUpsellId: 'tshirt' })],
      }),
    )
    expect(pricing.totalDue).toBe(9000 + 2000 - 1000)
  })

  it('spreads a winning code over every ticket, and a lone RANKED ticket is not left out', () => {
    const pricing = price(order({ participants: participantsOn('open', 'open', 'ranked'), promos: [percentCode('HALF', 50)] }))
    expect(pricing.groupDiscount.applied).toBe(false)
    expect(pricing.totalDue).toBe(8500)
  })

  it('lets a code apply to a mixed order that gets no group discount', () => {
    const pricing = price(order({ participants: participantsOn('open', 'ranked'), promos: [percentCode('HALF', 50)] }))
    expect(pricing.totalDue).toBe(6000)
  })

  it('never costs more with a code than without', () => {
    const without = price(order({ participants: opens(4) })).totalDue
    const withCode = price(order({ participants: opens(4), promos: [percentCode('SMALL', 5)] })).totalDue
    expect(withCode).toBeLessThanOrEqual(without)
  })
})
