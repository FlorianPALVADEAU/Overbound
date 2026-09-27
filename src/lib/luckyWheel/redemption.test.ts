import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  mintLuckyWheelPromoCode,
  markLuckyWheelAllocationRedeemed,
  AllocationNotFoundError,
  AllocationExpiredError,
  AllocationAlreadyRedeemedError,
  RewardNotRedeemableForDiscountError,
} from './redemption'

const CAMPAIGN_ID = 'campaign-1'

const ALLOCATION_BASE: {
  id: string
  redemption_code: string | null
  redeemed_at: string | null
  expires_at: string
  reward: {
    id: string
    type: string
    name: string
    campaign_id: string
    public_value: number
    target_upsell_id?: string | null
  }
} = {
  id: 'alloc-1',
  redemption_code: 'RPCTOKEN123', // RPC's opaque token, no LWHEEL- prefix
  redeemed_at: null,
  expires_at: new Date(Date.now() + 60_000).toISOString(),
  reward: {
    id: 'reward-1',
    type: 'TICKET_PERCENT_DISCOUNT',
    name: 'Réduction Lucky Wheel',
    campaign_id: CAMPAIGN_ID,
    public_value: 10,
    target_upsell_id: null,
  },
}

function buildAdmin({
  allocation,
  existingPromoCode = null,
  insertError = null,
}: {
  allocation: typeof ALLOCATION_BASE | null
  existingPromoCode?: { id: string; code: string } | null
  insertError?: unknown
}) {
  const inserted: any[] = []
  return {
    _inserted: inserted,
    from(table: string) {
      if (table === 'lucky_wheel_reward_allocations') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: allocation, error: null }),
            }),
          }),
          update: (payload: Record<string, unknown>) => {
            inserted.push({ table, action: 'update', payload })
            return { eq: async () => ({ error: null }) }
          },
        }
      }
      if (table === 'promotional_codes') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: existingPromoCode, error: null }),
            }),
          }),
          insert: (payload: Record<string, unknown>) => {
            inserted.push({ table, action: 'insert', payload })
            return {
              select: () => ({
                single: async () =>
                  insertError
                    ? { data: null, error: insertError }
                    : { data: { id: 'promo-1', code: 'LWHEEL-ALLOC1A' }, error: null },
              }),
            }
          },
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
  }
}

beforeEach(() => vi.clearAllMocks())

describe('mintLuckyWheelPromoCode', () => {
  it('generates a dedicated single-use promo code for a fresh discount allocation', async () => {
    const admin = buildAdmin({ allocation: ALLOCATION_BASE })

    const result = await mintLuckyWheelPromoCode({ admin, allocationId: 'alloc-1' })

    expect(result).toEqual({ code: 'LWHEEL-ALLOC1A', promotionalCodeId: 'promo-1' })
    const codeInsert = admin._inserted.find((entry) => entry.table === 'promotional_codes')
    expect(codeInsert.payload.usage_limit).toBe(1)
    expect(codeInsert.payload.discount_percent).toBe(10)
    expect(codeInsert.payload.currency).toBe('eur')
    const allocationUpdate = admin._inserted.find(
      (entry) => entry.table === 'lucky_wheel_reward_allocations',
    )
    expect(allocationUpdate.payload).toEqual({ redemption_code: 'LWHEEL-ALLOC1A' })
  })

  it('reuses an already-minted code instead of minting a duplicate', async () => {
    const admin = buildAdmin({
      allocation: { ...ALLOCATION_BASE, redemption_code: 'LWHEEL-EXIST01' },
      existingPromoCode: { id: 'promo-existing', code: 'LWHEEL-EXIST01' },
    })

    const result = await mintLuckyWheelPromoCode({ admin, allocationId: 'alloc-1' })

    expect(result).toEqual({ code: 'LWHEEL-EXIST01', promotionalCodeId: 'promo-existing' })
    expect(admin._inserted.some((entry) => entry.table === 'promotional_codes')).toBe(false)
  })

  it('throws AllocationNotFoundError for an unknown allocation', async () => {
    const admin = buildAdmin({ allocation: null })

    await expect(mintLuckyWheelPromoCode({ admin, allocationId: 'alloc-1' })).rejects.toBeInstanceOf(
      AllocationNotFoundError,
    )
  })

  it('throws AllocationExpiredError for an expired allocation', async () => {
    const admin = buildAdmin({
      allocation: { ...ALLOCATION_BASE, expires_at: new Date(Date.now() - 60_000).toISOString() },
    })

    await expect(mintLuckyWheelPromoCode({ admin, allocationId: 'alloc-1' })).rejects.toBeInstanceOf(
      AllocationExpiredError,
    )
  })

  it('throws AllocationAlreadyRedeemedError for an already-redeemed allocation', async () => {
    const admin = buildAdmin({
      allocation: { ...ALLOCATION_BASE, redeemed_at: new Date().toISOString() },
    })

    await expect(mintLuckyWheelPromoCode({ admin, allocationId: 'alloc-1' })).rejects.toBeInstanceOf(
      AllocationAlreadyRedeemedError,
    )
  })

  it('throws RewardNotRedeemableForDiscountError for a non-discount reward type', async () => {
    const admin = buildAdmin({
      allocation: { ...ALLOCATION_BASE, reward: { ...ALLOCATION_BASE.reward, type: 'CUSTOM' } },
    })

    await expect(mintLuckyWheelPromoCode({ admin, allocationId: 'alloc-1' })).rejects.toBeInstanceOf(
      RewardNotRedeemableForDiscountError,
    )
  })

  // FDR-0014 addendum (product-line discounts) §3.2, corrected 2026-09-27:
  // PRODUCT_DISCOUNT/PHOTO_DISCOUNT were percent-only, but real usage
  // proved that a fixed-amount case exists too ("-5€ sur pack photo",
  // silently read as -5%). Split into explicit percent/fixed variants --
  // see redemption.ts header.
  it('mints a code for PRODUCT_PERCENT_DISCOUNT, carrying target_upsell_id onto the minted code', async () => {
    const admin = buildAdmin({
      allocation: {
        ...ALLOCATION_BASE,
        reward: {
          ...ALLOCATION_BASE.reward,
          type: 'PRODUCT_PERCENT_DISCOUNT',
          public_value: 20,
          target_upsell_id: 'upsell-1',
        },
      },
    })

    const result = await mintLuckyWheelPromoCode({ admin, allocationId: 'alloc-1' })

    expect(result).toEqual({ code: 'LWHEEL-ALLOC1A', promotionalCodeId: 'promo-1' })
    const codeInsert = admin._inserted.find((entry) => entry.table === 'promotional_codes')
    expect(codeInsert.payload.target_upsell_id).toBe('upsell-1')
    expect(codeInsert.payload.discount_percent).toBe(20)
    expect(codeInsert.payload.discount_amount).toBeNull()
  })

  it('mints a code for PHOTO_PERCENT_DISCOUNT the same way as PRODUCT_PERCENT_DISCOUNT', async () => {
    const admin = buildAdmin({
      allocation: {
        ...ALLOCATION_BASE,
        reward: {
          ...ALLOCATION_BASE.reward,
          type: 'PHOTO_PERCENT_DISCOUNT',
          public_value: 15,
          target_upsell_id: 'upsell-photo',
        },
      },
    })

    const result = await mintLuckyWheelPromoCode({ admin, allocationId: 'alloc-1' })

    expect(result).toEqual({ code: 'LWHEEL-ALLOC1A', promotionalCodeId: 'promo-1' })
    const codeInsert = admin._inserted.find((entry) => entry.table === 'promotional_codes')
    expect(codeInsert.payload.target_upsell_id).toBe('upsell-photo')
    expect(codeInsert.payload.discount_percent).toBe(15)
  })

  // The real reported bug: a fixed-amount reward ("-5€ sur pack photo")
  // must produce discount_amount: 5, discount_percent: null -- not the
  // reverse.
  it('mints a code for PHOTO_FIXED_DISCOUNT as a fixed amount, not a percent', async () => {
    const admin = buildAdmin({
      allocation: {
        ...ALLOCATION_BASE,
        reward: {
          ...ALLOCATION_BASE.reward,
          type: 'PHOTO_FIXED_DISCOUNT',
          public_value: 5,
          target_upsell_id: 'upsell-photo',
        },
      },
    })

    await mintLuckyWheelPromoCode({ admin, allocationId: 'alloc-1' })

    const codeInsert = admin._inserted.find((entry) => entry.table === 'promotional_codes')
    expect(codeInsert.payload.discount_amount).toBe(5)
    expect(codeInsert.payload.discount_percent).toBeNull()
  })

  it('mints a code for PRODUCT_FIXED_DISCOUNT as a fixed amount', async () => {
    const admin = buildAdmin({
      allocation: {
        ...ALLOCATION_BASE,
        reward: {
          ...ALLOCATION_BASE.reward,
          type: 'PRODUCT_FIXED_DISCOUNT',
          public_value: 10,
          target_upsell_id: 'upsell-1',
        },
      },
    })

    await mintLuckyWheelPromoCode({ admin, allocationId: 'alloc-1' })

    const codeInsert = admin._inserted.find((entry) => entry.table === 'promotional_codes')
    expect(codeInsert.payload.discount_amount).toBe(10)
    expect(codeInsert.payload.discount_percent).toBeNull()
  })

  // The old unsuffixed types are ambiguous and no longer mintable at all --
  // must throw RewardNotRedeemableForDiscountError, same as any other
  // non-discount type, rather than guess a unit.
  it('throws RewardNotRedeemableForDiscountError for the legacy unsuffixed PRODUCT_DISCOUNT type', async () => {
    const admin = buildAdmin({
      allocation: { ...ALLOCATION_BASE, reward: { ...ALLOCATION_BASE.reward, type: 'PRODUCT_DISCOUNT' } },
    })

    await expect(mintLuckyWheelPromoCode({ admin, allocationId: 'alloc-1' })).rejects.toBeInstanceOf(
      RewardNotRedeemableForDiscountError,
    )
  })

  it('throws RewardNotRedeemableForDiscountError for the legacy unsuffixed PHOTO_DISCOUNT type', async () => {
    const admin = buildAdmin({
      allocation: { ...ALLOCATION_BASE, reward: { ...ALLOCATION_BASE.reward, type: 'PHOTO_DISCOUNT' } },
    })

    await expect(mintLuckyWheelPromoCode({ admin, allocationId: 'alloc-1' })).rejects.toBeInstanceOf(
      RewardNotRedeemableForDiscountError,
    )
  })

  // FDR-0014 §7 always intended FREE_TICKET as a 100%-off code, and
  // FREE_PRODUCT/FREE_PHOTO_PACK were given the same treatment 2026-09-27
  // after a participant won a physical patch and got no code -- see
  // redemption.ts header.
  it('mints a 100%-off code for FREE_TICKET, ignoring public_value entirely', async () => {
    const admin = buildAdmin({
      allocation: {
        ...ALLOCATION_BASE,
        reward: { ...ALLOCATION_BASE.reward, type: 'FREE_TICKET', public_value: 999, target_upsell_id: null },
      },
    })

    await mintLuckyWheelPromoCode({ admin, allocationId: 'alloc-1' })

    const codeInsert = admin._inserted.find((entry) => entry.table === 'promotional_codes')
    expect(codeInsert.payload.discount_percent).toBe(100)
    expect(codeInsert.payload.discount_amount).toBeNull()
    expect(codeInsert.payload.target_upsell_id).toBeNull()
  })

  it('mints a 100%-off code for FREE_PRODUCT, carrying target_upsell_id -- the real reported case (patch offert)', async () => {
    const admin = buildAdmin({
      allocation: {
        ...ALLOCATION_BASE,
        reward: {
          ...ALLOCATION_BASE.reward,
          type: 'FREE_PRODUCT',
          public_value: null as unknown as number,
          target_upsell_id: 'upsell-patch',
        },
      },
    })

    const result = await mintLuckyWheelPromoCode({ admin, allocationId: 'alloc-1' })

    expect(result).toEqual({ code: 'LWHEEL-ALLOC1A', promotionalCodeId: 'promo-1' })
    const codeInsert = admin._inserted.find((entry) => entry.table === 'promotional_codes')
    expect(codeInsert.payload.discount_percent).toBe(100)
    expect(codeInsert.payload.target_upsell_id).toBe('upsell-patch')
  })

  it('mints a 100%-off code for FREE_PHOTO_PACK the same way as FREE_PRODUCT', async () => {
    const admin = buildAdmin({
      allocation: {
        ...ALLOCATION_BASE,
        reward: {
          ...ALLOCATION_BASE.reward,
          type: 'FREE_PHOTO_PACK',
          public_value: null as unknown as number,
          target_upsell_id: 'upsell-photo',
        },
      },
    })

    await mintLuckyWheelPromoCode({ admin, allocationId: 'alloc-1' })

    const codeInsert = admin._inserted.find((entry) => entry.table === 'promotional_codes')
    expect(codeInsert.payload.discount_percent).toBe(100)
    expect(codeInsert.payload.target_upsell_id).toBe('upsell-photo')
  })

  it('leaves target_upsell_id null on the minted code for ticket-scoped reward types', async () => {
    const admin = buildAdmin({ allocation: ALLOCATION_BASE }) // TICKET_PERCENT_DISCOUNT, no target_upsell_id

    await mintLuckyWheelPromoCode({ admin, allocationId: 'alloc-1' })

    const codeInsert = admin._inserted.find((entry) => entry.table === 'promotional_codes')
    expect(codeInsert.payload.target_upsell_id).toBeNull()
  })
})

describe('markLuckyWheelAllocationRedeemed', () => {
  it('marks the matching allocation redeemed', async () => {
    const updateSpy = vi.fn(() => ({ eq: () => ({ is: async () => ({ error: null }) }) }))
    const admin = {
      from: (table: string) => {
        if (table === 'promotional_codes') {
          return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { code: 'LWHEEL-X' }, error: null }) }) }) }
        }
        if (table === 'lucky_wheel_reward_allocations') {
          return { update: updateSpy }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    }

    await markLuckyWheelAllocationRedeemed({ admin, promotionalCodeId: 'promo-1', orderId: 'order-1' })

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ order_id: 'order-1' }),
    )
  })

  it('is a no-op when the promo code is not a Lucky Wheel code', async () => {
    const admin = {
      from: (table: string) => {
        if (table === 'promotional_codes') {
          return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    }

    await expect(
      markLuckyWheelAllocationRedeemed({ admin, promotionalCodeId: 'promo-1', orderId: 'order-1' }),
    ).resolves.toBeUndefined()
  })
})
