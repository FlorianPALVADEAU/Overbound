import { describe, expect, it } from 'vitest'
import { CGV_VERSION } from '@/constants/legalVersions'
import type { OrderPricing } from '@/lib/orderPricing'
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
    })

    expect(metadata.cgv_version).toBe(CGV_VERSION)
    expect(CGV_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
