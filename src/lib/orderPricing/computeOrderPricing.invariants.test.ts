import { describe, expect, it } from 'vitest'
import { computeOrderPricing } from './computeOrderPricing'
import { FLEXIBLE_FEE, MEDAL, NOW, TSHIRT, amountCode, percentCode, tier } from './testFixtures'
import type { OrderPricing, OrderPricingInput, PricingPromo, PricingTicket } from './types'

/**
 * Almost every real order is unique, so beyond the hand-computed cases this
 * prices thousands of random orders and checks the rules that must hold for
 * all of them. The generator is seeded: a failure always replays the same way.
 */
const ORDER_COUNT = 5000

const seededRandom = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const PROMO_POOL: PricingPromo[] = [
  percentCode('HALF', 50),
  percentCode('SUMMER', 15),
  percentCode('WELCOME05', 5),
  amountCode('TEN', 1000),
  amountCode('HUGE', 50000),
  percentCode('FREEOPENTICKET', 100),
  percentCode('LUOFF30', 30),
  percentCode('JUOFF50', 50),
  percentCode('AMB10', 10, { isAmbassador: true }),
  amountCode('AMB5', 500, { isAmbassador: true }),
  percentCode('TEE50', 50, { targetUpsellId: 'tshirt' }),
  amountCode('MEDAL3', 300, { targetUpsellId: 'medal' }),
]

const randomOrder = (random: () => number): OrderPricingInput => {
  const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1))
  const pick = <T,>(items: readonly T[]) => items[int(0, items.length - 1)] as T

  const tickets: PricingTicket[] = [
    { id: 'open', name: 'OPEN', finalPriceCents: int(500, 12000), isOpenFormat: true },
    { id: 'ranked', name: 'RANKED', finalPriceCents: int(500, 12000), isOpenFormat: false },
  ]
  const tiers = random() < 0.5 ? [] : [
    tier({ discountPercentage: int(0, 60), maxRegistrations: random() < 0.5 ? null : int(1, 40) }),
    tier({ id: 'late', displayOrder: 2, discountPercentage: int(0, 30), maxRegistrations: null }),
  ]
  const participants = Array.from({ length: int(1, 10) }, () => ({
    ticketId: pick(['open', 'ranked']),
    flexible: random() < 0.25,
  }))
  const promos = Array.from({ length: int(0, 3) }, () => pick(PROMO_POOL))

  return {
    participants,
    tickets,
    tiers,
    tierRegistrationCounts: { early: int(0, 40) },
    upsells: [TSHIRT, MEDAL],
    upsellLines: [
      { upsellId: 'tshirt', quantity: int(0, participants.length) },
      { upsellId: 'medal', quantity: int(0, participants.length * 2) },
    ],
    promos,
    flexibleFeeCents: FLEXIBLE_FEE,
    now: NOW,
  }
}

const priceOrNull = (input: OrderPricingInput): OrderPricing | null => {
  const result = computeOrderPricing(input)
  return result.ok ? result.value : null
}

const orders = (() => {
  const random = seededRandom(20261012)
  return Array.from({ length: ORDER_COUNT }, () => randomOrder(random)).flatMap((input) => {
    const pricing = priceOrNull(input)
    return pricing ? [{ input, pricing }] : []
  })
})()

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

describe('computeOrderPricing — invariants over random orders', () => {
  it('prices most generated orders (tiers sold out are the only refusal)', () => {
    expect(orders.length).toBeGreaterThan(ORDER_COUNT * 0.8)
  })

  it('never asks for a negative amount', () => {
    for (const { pricing } of orders) expect(pricing.totalDue).toBeGreaterThanOrEqual(0)
  })

  it('adds up: tickets + upsells + flexible - discounts = total', () => {
    for (const { pricing } of orders) {
      expect(pricing.totalDue).toBe(
        pricing.ticketSubtotal + pricing.upsellSubtotal + pricing.flexibleTotal - pricing.discountAmount,
      )
      expect(pricing.discountAmount).toBe(sum(pricing.discounts.map((d) => d.amountCents)))
    }
  })

  it('never discounts tickets beyond their price, nor an upsell beyond its own price', () => {
    for (const { pricing } of orders) {
      expect(pricing.ticketDiscountAmount).toBeLessThanOrEqual(pricing.ticketSubtotal)
      for (const [upsellId, subtotal] of Object.entries(pricing.upsellSubtotalsById)) {
        const onUpsell = pricing.discounts
          .filter((d) => d.target.kind === 'upsell' && d.target.upsellId === upsellId)
          .map((d) => d.amountCents)
        expect(sum(onUpsell)).toBeLessThanOrEqual(subtotal)
      }
    }
  })

  it('always charges the flexible option in full', () => {
    for (const { input, pricing } of orders) {
      const flexibleCount = input.participants.filter((p) => p.flexible).length
      expect(pricing.flexibleTotal).toBe(flexibleCount * FLEXIBLE_FEE)
      expect(pricing.totalDue).toBeGreaterThanOrEqual(pricing.flexibleTotal)
    }
  })

  it('splits the ticket discount over bibs without losing a cent', () => {
    for (const { pricing } of orders) {
      const paid = sum(pricing.participants.map((p) => p.paidPriceCents))
      expect(paid).toBe(pricing.ticketSubtotal - pricing.ticketDiscountAmount)
      for (const participant of pricing.participants) expect(participant.paidPriceCents).toBeGreaterThanOrEqual(0)
    }
  })

  it('never raises the total when a code is added', () => {
    const random = seededRandom(7)
    for (const { input, pricing } of orders) {
      const withOneMore = priceOrNull({ ...input, promos: [...input.promos, PROMO_POOL[Math.floor(random() * PROMO_POOL.length)]!] })
      if (withOneMore) expect(withOneMore.totalDue).toBeLessThanOrEqual(pricing.totalDue)
    }
  })

  it('gives the same price whatever order accepted codes were typed in', () => {
    for (const { input, pricing } of orders) {
      if (pricing.rejections.length > 0 || input.promos.length < 2) continue
      const reversed = priceOrNull({ ...input, promos: [...input.promos].reverse() })
      expect(reversed?.totalDue).toBe(pricing.totalDue)
    }
  })
})
