import { describe, expect, it } from 'vitest'
import { createBalance } from '../../balance'
import type { TierPricedParticipant } from '../../participantPricing'
import { amountCode, percentCode } from '../../testFixtures'
import type { DiscountContext } from '../strategy'
import { fixedAmountStrategy } from './fixedAmount'
import { strategyFor } from './index'
import { openTicketStrategy } from './openTicket'
import { percentStrategy } from './percent'
import { productStrategy } from './product'
import { tierExclusiveStrategy } from './tierExclusive'

const participant = (unitPriceCents: number, isOpenFormat: boolean): TierPricedParticipant => ({
  ticketId: isOpenFormat ? 'open' : 'ranked',
  tierId: null,
  basePriceCents: unitPriceCents,
  unitPriceCents,
  isOpenFormat,
  flexible: false,
})

const context = (overrides: Partial<DiscountContext> = {}): DiscountContext => ({
  participants: [participant(5000, true)],
  baseTicketSubtotal: 5000,
  tierDiscountAmount: 0,
  ...overrides,
})

const TICKETS = { kind: 'tickets' } as const

describe('openTicketStrategy', () => {
  it('discounts the first OPEN ticket only', () => {
    const ctx = context({ participants: [participant(7000, false), participant(5000, true), participant(5000, true)] })
    const outcome = openTicketStrategy.apply(percentCode('LUCKYOPENTICKET', 100), createBalance(17000, {}), ctx)
    expect(outcome).toEqual({ kind: 'applied', target: TICKETS, amountCents: 5000 })
  })

  it('is rejected when the order has no OPEN ticket', () => {
    const ctx = context({ participants: [participant(7000, false)] })
    const outcome = openTicketStrategy.apply(percentCode('LUCKYOPENTICKET', 100), createBalance(7000, {}), ctx)
    expect(outcome).toEqual({ kind: 'rejected', reason: 'OPEN_TICKET_CODE_WITHOUT_OPEN_TICKET' })
  })

  it('never takes more than what is left to pay', () => {
    const outcome = openTicketStrategy.apply(percentCode('XOPENTICKET', 100), createBalance(1000, {}), context())
    expect(outcome).toEqual({ kind: 'applied', target: TICKETS, amountCents: 1000 })
  })
})

describe('tierExclusiveStrategy', () => {
  it('adds only what the code gives beyond the tier', () => {
    // 2 x 50 € at -20 % tier: 2 000 of tier discount, LUOFF30 is worth 3 000 on full price.
    const ctx = context({ baseTicketSubtotal: 10000, tierDiscountAmount: 2000 })
    const outcome = tierExclusiveStrategy.apply(percentCode('LUOFF30', 30), createBalance(8000, {}), ctx)
    expect(outcome).toEqual({ kind: 'applied', target: TICKETS, amountCents: 1000 })
  })

  it('adds nothing when the tier is already better', () => {
    const ctx = context({ baseTicketSubtotal: 10000, tierDiscountAmount: 5000 })
    const outcome = tierExclusiveStrategy.apply(percentCode('LUOFF30', 30), createBalance(5000, {}), ctx)
    expect(outcome).toEqual({ kind: 'applied', target: TICKETS, amountCents: 0 })
  })
})

describe('percentStrategy', () => {
  it('takes its percentage of what is left to pay', () => {
    const outcome = percentStrategy.apply(percentCode('HALF', 50), createBalance(5000, {}), context())
    expect(outcome).toEqual({ kind: 'applied', target: TICKETS, amountCents: 2500 })
  })

  it('rounds to the nearest cent', () => {
    const outcome = percentStrategy.apply(percentCode('THIRD', 33), createBalance(10001, {}), context())
    expect(outcome).toEqual({ kind: 'applied', target: TICKETS, amountCents: 3300 })
  })
})

describe('fixedAmountStrategy', () => {
  it('takes its amount', () => {
    const outcome = fixedAmountStrategy.apply(amountCode('TEN', 1000), createBalance(5000, {}), context())
    expect(outcome).toEqual({ kind: 'applied', target: TICKETS, amountCents: 1000 })
  })

  it('is capped at what is left to pay', () => {
    const outcome = fixedAmountStrategy.apply(amountCode('TEN', 1000), createBalance(800, {}), context())
    expect(outcome).toEqual({ kind: 'applied', target: TICKETS, amountCents: 800 })
  })
})

describe('productStrategy', () => {
  const tee = percentCode('TEE50', 50, { targetUpsellId: 'tshirt' })

  it('discounts its upsell only', () => {
    const outcome = productStrategy.apply(tee, createBalance(5000, { tshirt: 4000 }), context())
    expect(outcome).toEqual({ kind: 'applied', target: { kind: 'upsell', upsellId: 'tshirt' }, amountCents: 2000 })
  })

  it('is worth nothing when its upsell is not in the cart', () => {
    const outcome = productStrategy.apply(tee, createBalance(5000, {}), context())
    expect(outcome).toEqual({ kind: 'applied', target: { kind: 'upsell', upsellId: 'tshirt' }, amountCents: 0 })
  })
})

describe('strategyFor', () => {
  it('routes a product code ending with OPENTICKET to the product strategy', () => {
    expect(strategyFor(percentCode('TEEOPENTICKET', 10, { targetUpsellId: 'tshirt' }))?.name).toBe('product')
  })

  it('routes an OPENTICKET code to the OPEN ticket strategy', () => {
    expect(strategyFor(percentCode('FREEOPENTICKET', 100))?.name).toBe('openTicket')
  })

  it('routes a code with both a percentage and an amount to the percentage', () => {
    expect(strategyFor(percentCode('BOTH', 10, { discountAmountCents: 500 }))?.name).toBe('percent')
  })

  it('has no strategy for a code worth nothing', () => {
    expect(strategyFor(percentCode('ZERO', 0))).toBeNull()
  })
})
