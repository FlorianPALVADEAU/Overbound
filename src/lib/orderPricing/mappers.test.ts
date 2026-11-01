import { describe, expect, it } from 'vitest'
import { appliedPromoToPricingPromo, hasAmbassadorLink, isAmbassadorPromoRow, toPricingPromo, toPricingTicket, toPricingTier } from './mappers'

describe('pricing mappers', () => {
  it('detects the OPEN format from the ticket or race name', () => {
    expect(toPricingTicket({ id: 't', name: 'Pass journée', final_price_cents: 5000, race: { name: 'Open 2 km' } }).isOpenFormat).toBe(true)
    expect(toPricingTicket({ id: 't', name: 'RANKED', final_price_cents: 7000, race: null }).isOpenFormat).toBe(false)
  })

  it('reads an ambassador link as an array or an object', () => {
    expect(hasAmbassadorLink([{ id: 'a' }])).toBe(true)
    expect(hasAmbassadorLink({ id: 'a' })).toBe(true)
    expect(hasAmbassadorLink([])).toBe(false)
    expect(hasAmbassadorLink(null)).toBe(false)
  })

  it('knows a code is an ambassador code from either link table', () => {
    expect(isAmbassadorPromoRow({ ambassadors: [{ id: 'a' }], ambassador_codes: [] })).toBe(true)
    expect(isAmbassadorPromoRow({ ambassadors: [], ambassador_codes: [{ ambassador_id: 'a' }] })).toBe(true)
    expect(isAmbassadorPromoRow({ ambassadors: [], ambassador_codes: [] })).toBe(false)
    expect(isAmbassadorPromoRow(null)).toBe(false)
  })

  it('prices a multi-code ambassador code as an ambassador code', () => {
    expect(
      toPricingPromo({ code: 'FLO', discount_percent: 10, discount_amount: null, ambassadors: [], ambassador_codes: [{ ambassador_id: 'a' }] }).isAmbassador,
    ).toBe(true)
  })

  it('maps a product promo row', () => {
    expect(
      toPricingPromo({ code: 'TEE', discount_percent: 50, discount_amount: null, target_upsell_id: 'tshirt', ambassadors: [] }),
    ).toEqual({ code: 'TEE', discountPercent: 50, discountAmountCents: null, targetUpsellId: 'tshirt', isAmbassador: false })
  })

  it('defaults missing tier fields to no order and no cap', () => {
    const tier = toPricingTier({ id: 'x', discount_percentage: 10, available_from: null, available_until: null })
    expect(tier).toMatchObject({ displayOrder: null, maxRegistrations: null })
  })
})

describe('appliedPromoToPricingPromo', () => {
  it('keeps the ambassador flag the browser received', () => {
    expect(
      appliedPromoToPricingPromo({ code: 'AMB', discount_percent: 10, discount_amount: null, is_ambassador: true }),
    ).toMatchObject({ code: 'AMB', isAmbassador: true, targetUpsellId: null })
  })

  it('treats a missing flag as a regular code', () => {
    expect(appliedPromoToPricingPromo({ code: 'X', discount_percent: null, discount_amount: 500 }).isAmbassador).toBe(false)
  })
})
