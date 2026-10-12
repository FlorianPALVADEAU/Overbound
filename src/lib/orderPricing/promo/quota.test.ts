import { describe, expect, it } from 'vitest'
import { promo } from '../testFixtures'
import { checkPromoQuota } from './quota'

const ambassador = (code: string) => promo(code, { isAmbassador: true })
const product = (code: string) => promo(code, { targetUpsellId: 'tshirt' })
const reasons = (codes: Parameters<typeof checkPromoQuota>[0]) =>
  checkPromoQuota(codes).rejections.map((rejection) => rejection.reason)

describe('checkPromoQuota', () => {
  it('accepts an ambassador code with a ticket code', () => {
    expect(reasons([ambassador('AMBA'), promo('SUMMER')])).toEqual([])
  })

  it('accepts a ticket code with a product code', () => {
    expect(reasons([promo('SUMMER'), product('TEE')])).toEqual([])
  })

  it('accepts two ticket codes when one is WELCOME05', () => {
    expect(reasons([promo('SUMMER'), promo('welcome05')])).toEqual([])
  })

  it('rejects a second ticket code', () => {
    expect(reasons([promo('SUMMER'), promo('WINTER')])).toEqual(['ONE_TICKET_CODE'])
  })

  it('rejects a second ambassador code', () => {
    expect(reasons([ambassador('AMBA'), ambassador('AMBB')])).toEqual(['ONE_AMBASSADOR_CODE'])
  })

  it('rejects a second product code, even next to WELCOME05', () => {
    expect(reasons([product('TEE'), product('WELCOME05')])).toEqual(['ONE_PRODUCT_CODE'])
  })

  it('rejects a third code', () => {
    expect(reasons([ambassador('AMBA'), promo('SUMMER'), product('TEE')])).toEqual(['TOO_MANY_CODES'])
  })

  it('rejects the same code typed twice', () => {
    expect(reasons([promo('SUMMER'), promo(' summer ')])).toEqual(['DUPLICATE_CODE'])
  })

  it('keeps the first codes and rejects the one that breaks a rule', () => {
    const { kept } = checkPromoQuota([promo('SUMMER'), promo('WINTER')])
    expect(kept.map((item) => item.code)).toEqual(['SUMMER'])
  })
})
