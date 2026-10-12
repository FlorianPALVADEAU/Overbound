import { describe, expect, it } from 'vitest'
import { FLEXIBLE_TICKET_FEE_CENTS } from '@/lib/tickets/flexibleTicket'
import { buildPricingInput } from './buildPricingInput'

describe('buildPricingInput', () => {
  const now = new Date('2026-06-01T12:00:00Z')

  it('maps every row family and keeps the request as is', () => {
    const input = buildPricingInput(
      {
        tickets: [{ id: 'open', name: 'OPEN', final_price_cents: 5000 }],
        tiers: [{ id: 'early', discount_percentage: 20, available_from: null, available_until: null }],
        tierRegistrationCounts: { early: 3 },
        upsells: [{ id: 'tshirt', price_cents: 2000 }],
        promos: [{ code: 'SUMMER', discount_percent: 10, discount_amount: null }],
      },
      { participants: [{ ticketId: 'open', flexible: true }], upsellLines: [{ upsellId: 'tshirt', quantity: 1 }], now },
    )
    expect(input.tickets[0]).toMatchObject({ id: 'open', isOpenFormat: true })
    expect(input.upsells).toEqual([{ id: 'tshirt', priceCents: 2000 }])
    expect(input.promos[0]).toMatchObject({ code: 'SUMMER', isAmbassador: false })
    expect(input.flexibleFeeCents).toBe(FLEXIBLE_TICKET_FEE_CENTS)
    expect(input.now).toBe(now)
  })

  it('builds an empty order without failing', () => {
    const input = buildPricingInput(
      { tickets: [], tiers: [], tierRegistrationCounts: {}, upsells: [], promos: [] },
      { participants: [], upsellLines: [], now },
    )
    expect(input.participants).toEqual([])
  })
})
