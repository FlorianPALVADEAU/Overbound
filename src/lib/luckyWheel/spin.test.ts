import { describe, expect, it, vi, beforeEach } from 'vitest'
import { spinLuckyWheel, WheelEntryNotFoundError, AlreadySpunError, CampaignUnavailableError } from './spin'

const mintLuckyWheelPromoCode = vi.fn()
vi.mock('./redemption', () => ({
  mintLuckyWheelPromoCode: (...args: unknown[]) => mintLuckyWheelPromoCode(...args),
}))

const buildAdmin = (rpcImpl: (...args: any[]) => any) => ({
  rpc: vi.fn(rpcImpl),
})

beforeEach(() => {
  mintLuckyWheelPromoCode.mockReset()
  mintLuckyWheelPromoCode.mockResolvedValue({ code: 'LWHEEL-ALLOC1A', promotionalCodeId: 'promo-1' })
})

describe('spinLuckyWheel', () => {
  it('mints a promo code and returns it for a discount-type win', async () => {
    const admin = buildAdmin(() =>
      Promise.resolve({
        data: {
          success: true,
          allocation_id: 'alloc-1',
          reward_id: 'reward-1',
          reward_name: 'Réduction 10%',
          reward_type: 'TICKET_PERCENT_DISCOUNT',
          redemption_code: 'RPCTOKEN123',
          won_at: '2026-09-20T10:00:00Z',
          expires_at: '2026-09-22T10:00:00Z',
        },
        error: null,
      }),
    )

    const result = await spinLuckyWheel({ admin, wheelEntryId: 'entry-1' })

    expect(result).toEqual({
      success: true,
      allocationId: 'alloc-1',
      rewardId: 'reward-1',
      rewardName: 'Réduction 10%',
      rewardType: 'TICKET_PERCENT_DISCOUNT',
      promoCode: 'LWHEEL-ALLOC1A',
      wonAt: '2026-09-20T10:00:00Z',
      expiresAt: '2026-09-22T10:00:00Z',
    })
    expect(mintLuckyWheelPromoCode).toHaveBeenCalledWith({ admin, allocationId: 'alloc-1' })
    expect(admin.rpc).toHaveBeenCalledWith('lucky_wheel_spin', { p_wheel_entry_id: 'entry-1' })
  })

  // FDR-0014 addendum (product-line discounts) §3.3, corrected 2026-09-27:
  // PRODUCT_PERCENT_DISCOUNT/PRODUCT_FIXED_DISCOUNT/PHOTO_PERCENT_DISCOUNT/
  // PHOTO_FIXED_DISCOUNT route through the same mint path as ticket types --
  // the old unsuffixed PRODUCT_DISCOUNT/PHOTO_DISCOUNT are no longer
  // minted at all (see redemption.ts header for why).
  it('mints a promo code for a PRODUCT_PERCENT_DISCOUNT win, same as ticket-scoped types', async () => {
    const admin = buildAdmin(() =>
      Promise.resolve({
        data: {
          success: true,
          allocation_id: 'alloc-3',
          reward_id: 'reward-3',
          reward_name: '20% sur T-shirt finisher',
          reward_type: 'PRODUCT_PERCENT_DISCOUNT',
          redemption_code: 'RPCTOKEN789',
          won_at: '2026-09-20T10:00:00Z',
          expires_at: '2026-09-22T10:00:00Z',
        },
        error: null,
      }),
    )

    const result = await spinLuckyWheel({ admin, wheelEntryId: 'entry-1' })

    expect(result).toMatchObject({ success: true, rewardType: 'PRODUCT_PERCENT_DISCOUNT', promoCode: 'LWHEEL-ALLOC1A' })
    expect(mintLuckyWheelPromoCode).toHaveBeenCalledWith({ admin, allocationId: 'alloc-3' })
  })

  it('mints a promo code for a PHOTO_FIXED_DISCOUNT win -- the real reported case ("-5€ sur pack photo")', async () => {
    const admin = buildAdmin(() =>
      Promise.resolve({
        data: {
          success: true,
          allocation_id: 'alloc-4',
          reward_id: 'reward-4',
          reward_name: '-5€ sur pack photo',
          reward_type: 'PHOTO_FIXED_DISCOUNT',
          redemption_code: 'RPCTOKEN012',
          won_at: '2026-09-20T10:00:00Z',
          expires_at: '2026-09-22T10:00:00Z',
        },
        error: null,
      }),
    )

    const result = await spinLuckyWheel({ admin, wheelEntryId: 'entry-1' })

    expect(result).toMatchObject({ success: true, rewardType: 'PHOTO_FIXED_DISCOUNT', promoCode: 'LWHEEL-ALLOC1A' })
    expect(mintLuckyWheelPromoCode).toHaveBeenCalledWith({ admin, allocationId: 'alloc-4' })
  })

  // The old unsuffixed types are no longer mintable at all -- a reward
  // still saved under one must be corrected first (admin edits the reward
  // to a *_PERCENT_/*_FIXED_ variant), not silently minted with a guessed
  // unit a second time.
  it('does not mint a promo code for the legacy unsuffixed PRODUCT_DISCOUNT type', async () => {
    const admin = buildAdmin(() =>
      Promise.resolve({
        data: {
          success: true,
          allocation_id: 'alloc-5',
          reward_id: 'reward-5',
          reward_name: 'Ancienne remise produit',
          reward_type: 'PRODUCT_DISCOUNT',
          redemption_code: 'RPCTOKEN345',
          won_at: '2026-09-20T10:00:00Z',
          expires_at: '2026-09-22T10:00:00Z',
        },
        error: null,
      }),
    )

    const result = await spinLuckyWheel({ admin, wheelEntryId: 'entry-1' })

    expect(result).toMatchObject({ success: true, rewardType: 'PRODUCT_DISCOUNT', promoCode: null })
    expect(mintLuckyWheelPromoCode).not.toHaveBeenCalled()
  })

  // FDR-0014 §7 always intended FREE_TICKET as a 100%-off code, and
  // FREE_PRODUCT/FREE_PHOTO_PACK joined it 2026-09-27 (a participant won a
  // physical patch, FREE_PRODUCT, and got no code -- see redemption.ts
  // header). CUSTOM is the actual example of a type with no checkout-side
  // effect at all.
  it('mints a promo code for a FREE_PRODUCT win -- the real reported case (patch offert)', async () => {
    const admin = buildAdmin(() =>
      Promise.resolve({
        data: {
          success: true,
          allocation_id: 'alloc-2',
          reward_id: 'reward-2',
          reward_name: 'Patch Overbound offert',
          reward_type: 'FREE_PRODUCT',
          redemption_code: 'RPCTOKEN456',
          won_at: '2026-09-20T10:00:00Z',
          expires_at: '2026-09-22T10:00:00Z',
        },
        error: null,
      }),
    )

    const result = await spinLuckyWheel({ admin, wheelEntryId: 'entry-1' })

    expect(result).toMatchObject({ success: true, rewardType: 'FREE_PRODUCT', promoCode: 'LWHEEL-ALLOC1A' })
    expect(mintLuckyWheelPromoCode).toHaveBeenCalledWith({ admin, allocationId: 'alloc-2' })
  })

  it('does not mint a promo code for a non-discount win', async () => {
    const admin = buildAdmin(() =>
      Promise.resolve({
        data: {
          success: true,
          allocation_id: 'alloc-6',
          reward_id: 'reward-6',
          reward_name: 'Personnalisé',
          reward_type: 'CUSTOM',
          redemption_code: 'RPCTOKEN999',
          won_at: '2026-09-20T10:00:00Z',
          expires_at: '2026-09-22T10:00:00Z',
        },
        error: null,
      }),
    )

    const result = await spinLuckyWheel({ admin, wheelEntryId: 'entry-1' })

    expect(result).toEqual({
      success: true,
      allocationId: 'alloc-6',
      rewardId: 'reward-6',
      rewardName: 'Personnalisé',
      rewardType: 'CUSTOM',
      promoCode: null,
      wonAt: '2026-09-20T10:00:00Z',
      expiresAt: '2026-09-22T10:00:00Z',
    })
    expect(mintLuckyWheelPromoCode).not.toHaveBeenCalled()
  })

  it('returns a structured NO_REWARD_AVAILABLE result without throwing', async () => {
    const admin = buildAdmin(() =>
      Promise.resolve({ data: { success: false, error: 'NO_REWARD_AVAILABLE' }, error: null }),
    )

    const result = await spinLuckyWheel({ admin, wheelEntryId: 'entry-1' })

    expect(result).toEqual({ success: false, error: 'NO_REWARD_AVAILABLE' })
    expect(mintLuckyWheelPromoCode).not.toHaveBeenCalled()
  })

  it('throws WheelEntryNotFoundError when the entry does not exist', async () => {
    const admin = buildAdmin(() =>
      Promise.resolve({ data: null, error: new Error('WHEEL_ENTRY_NOT_FOUND: entry entry-1 not found') }),
    )

    await expect(spinLuckyWheel({ admin, wheelEntryId: 'entry-1' })).rejects.toBeInstanceOf(
      WheelEntryNotFoundError,
    )
  })

  it('throws AlreadySpunError on a refresh-triggered reroll attempt', async () => {
    const admin = buildAdmin(() =>
      Promise.resolve({ data: null, error: new Error('ALREADY_SPUN: entry entry-1 already spun') }),
    )

    await expect(spinLuckyWheel({ admin, wheelEntryId: 'entry-1' })).rejects.toBeInstanceOf(
      AlreadySpunError,
    )
  })

  it('throws CampaignUnavailableError when the campaign is paused', async () => {
    const admin = buildAdmin(() =>
      Promise.resolve({
        data: null,
        error: new Error('CAMPAIGN_UNAVAILABLE: campaign campaign-1 is disabled or paused'),
      }),
    )

    await expect(spinLuckyWheel({ admin, wheelEntryId: 'entry-1' })).rejects.toBeInstanceOf(
      CampaignUnavailableError,
    )
  })

  it('rethrows unrelated RPC errors unchanged', async () => {
    const admin = buildAdmin(() => Promise.resolve({ data: null, error: new Error('connection reset') }))

    await expect(spinLuckyWheel({ admin, wheelEntryId: 'entry-1' })).rejects.toThrow('connection reset')
  })
})
