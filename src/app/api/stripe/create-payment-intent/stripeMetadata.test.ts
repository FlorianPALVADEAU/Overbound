import { describe, expect, it } from 'vitest'
import { CGV_VERSION } from '@/constants/legalVersions'
import type { OrderPricing } from '@/lib/orderPricing'
import { readPaidCompanions } from '@/lib/tickets/openCompanion'
import { buildOrderMetadata } from './stripeMetadata'

const pricing = { discountAmount: 0, tierAllocations: [], discounts: [], participants: [] } as unknown as OrderPricing

describe('buildOrderMetadata', () => {
  it('stamps the CGV version in force on the order metadata', () => {
    const metadata = buildOrderMetadata({
      pricing,
      currency: 'eur',
      primaryPromoCode: '',
      ambassadorReferralCode: null,
      utmParams: '',
      companionWaveIndexes: [],
    })

    expect(metadata.cgv_version).toBe(CGV_VERSION)
    expect(CGV_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('records each companion bib with its SAS and price, aligned by participant position', () => {
    const withCompanion = {
      discountAmount: 0,
      tierAllocations: [],
      discounts: [],
      participants: [
        { paidPriceCents: 7000, flexible: false, companionPriceCents: 0 },
        { paidPriceCents: 7000, flexible: false, companionPriceCents: 2900 },
      ],
    } as unknown as OrderPricing
    const metadata = buildOrderMetadata({
      pricing: withCompanion,
      currency: 'eur',
      primaryPromoCode: '',
      ambassadorReferralCode: null,
      utmParams: '',
      companionWaveIndexes: [null, 7],
    })

    expect(readPaidCompanions(metadata)).toEqual([{ participantIndex: 1, waveIndex: 7, priceCents: 2900 }])
  })

  it('records nothing for a priced companion without a SAS', () => {
    const odd = {
      discountAmount: 0,
      tierAllocations: [],
      discounts: [],
      participants: [{ paidPriceCents: 7000, flexible: false, companionPriceCents: 2900 }],
    } as unknown as OrderPricing
    const metadata = buildOrderMetadata({
      pricing: odd,
      currency: 'eur',
      primaryPromoCode: '',
      ambassadorReferralCode: null,
      utmParams: '',
      companionWaveIndexes: [null],
    })

    expect(readPaidCompanions(metadata)).toEqual([])
  })
})
