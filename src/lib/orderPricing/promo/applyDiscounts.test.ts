import { describe, expect, it } from 'vitest'
import { createBalance } from '../balance'
import { amountCode, percentCode } from '../testFixtures'
import { applyDiscounts } from './applyDiscounts'

const context = {
  participants: [
    { ticketId: 'open', tierId: null, basePriceCents: 5000, unitPriceCents: 5000, isOpenFormat: true, flexible: false },
    { ticketId: 'open', tierId: null, basePriceCents: 5000, unitPriceCents: 5000, isOpenFormat: true, flexible: false },
  ],
  baseTicketSubtotal: 10000,
  tierDiscountAmount: 0,
}

const amounts = (result: ReturnType<typeof applyDiscounts>) =>
  result.discounts.map((discount) => [discount.code, discount.amountCents])

describe('applyDiscounts', () => {
  it('applies a percentage to what an OPEN ticket code left to pay', () => {
    const result = applyDiscounts(
      [percentCode('HALF', 50), percentCode('FREEOPENTICKET', 100)],
      createBalance(10000, {}),
      context,
    )
    expect(amounts(result)).toEqual([['FREEOPENTICKET', 5000], ['HALF', 2500]])
  })

  it('applies percentages before fixed amounts', () => {
    const result = applyDiscounts([amountCode('TEN', 1000), percentCode('HALF', 50)], createBalance(10000, {}), context)
    expect(amounts(result)).toEqual([['HALF', 5000], ['TEN', 1000]])
  })

  it('gives the same result whatever order the codes were typed in', () => {
    const codes = [percentCode('WELCOME05', 5), percentCode('SUMMER', 15)]
    const forward = applyDiscounts(codes, createBalance(9999, {}), context)
    const backward = applyDiscounts([...codes].reverse(), createBalance(9999, {}), context)
    expect(forward).toEqual(backward)
  })

  it('leaves out a code worth nothing', () => {
    const tee = percentCode('TEE', 50, { targetUpsellId: 'tshirt' })
    expect(applyDiscounts([tee], createBalance(10000, {}), context).discounts).toEqual([])
  })

  it('reports a code that cannot apply', () => {
    const rankedOnly = { ...context, participants: context.participants.map((p) => ({ ...p, isOpenFormat: false })) }
    const result = applyDiscounts([percentCode('FREEOPENTICKET', 100)], createBalance(10000, {}), rankedOnly)
    expect(result.rejections).toEqual([{ code: 'FREEOPENTICKET', reason: 'OPEN_TICKET_CODE_WITHOUT_OPEN_TICKET' }])
  })
})
