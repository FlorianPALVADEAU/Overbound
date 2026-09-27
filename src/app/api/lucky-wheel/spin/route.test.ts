import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/rateLimit', () => ({
  getClientIp: () => '127.0.0.1',
  rateLimit: () => ({ allowed: true, remaining: 9, resetAt: Date.now() + 60_000 }),
}))

const { sendLuckyWheelRewardEmailMock } = vi.hoisted(() => ({
  sendLuckyWheelRewardEmailMock: vi.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null }),
}))

vi.mock('@/lib/email', () => ({
  sendLuckyWheelRewardEmail: sendLuckyWheelRewardEmailMock,
}))

const mintLuckyWheelPromoCodeMock = vi.fn()
vi.mock('@/lib/luckyWheel/redemption', () => ({
  mintLuckyWheelPromoCode: (...args: unknown[]) => mintLuckyWheelPromoCodeMock(...args),
}))

import { POST } from './route'

function buildRequest(body: unknown) {
  return new Request('http://localhost/api/lucky-wheel/spin', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as any
}

function buildAdmin(rpcResult: { data: unknown; error: unknown }) {
  return {
    rpc: vi.fn(async () => rpcResult),
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { email: 'runner@example.com', event_id: 'event-1' },
            error: null,
          }),
        }),
      }),
    })),
  }
}

beforeEach(() => {
  supabaseAdminMock.mockReset()
  sendLuckyWheelRewardEmailMock.mockClear()
  mintLuckyWheelPromoCodeMock.mockReset()
  mintLuckyWheelPromoCodeMock.mockResolvedValue({ code: 'LWHEEL-ALLOC1A', promotionalCodeId: 'promo-1' })
})

describe('POST /api/lucky-wheel/spin', () => {
  it('mints and returns a promo code for a discount-type win', async () => {
    supabaseAdminMock.mockReturnValue(
      buildAdmin({
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

    const response = await POST(buildRequest({ wheel_entry_id: 'aaaaaaaa-1111-4111-8111-111111111111' }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({ success: true, promo_code: 'LWHEEL-ALLOC1A' })

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(sendLuckyWheelRewardEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'runner@example.com', promoCode: 'LWHEEL-ALLOC1A' }),
    )
  })

  it('returns the winning allocation on success', async () => {
    // CUSTOM is the actual example of a reward type with no checkout-side
    // effect -- FREE_PRODUCT joined the mint path 2026-09-27 (see
    // redemption.ts header), it is no longer a "no code" example.
    supabaseAdminMock.mockReturnValue(
      buildAdmin({
        data: {
          success: true,
          allocation_id: 'alloc-1',
          reward_id: 'reward-1',
          reward_name: 'Badge ambassadeur',
          reward_type: 'CUSTOM',
          redemption_code: 'ABC123',
          won_at: '2026-09-20T10:00:00Z',
          expires_at: '2026-09-22T10:00:00Z',
        },
        error: null,
      }),
    )

    const response = await POST(buildRequest({ wheel_entry_id: 'aaaaaaaa-1111-4111-8111-111111111111' }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({ success: true, allocation_id: 'alloc-1', promo_code: null })

    // Reward email fires in the background (fire-and-forget) -- flush
    // microtasks so the (already-awaited-internally) send has a chance to run.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(sendLuckyWheelRewardEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'runner@example.com', rewardName: 'Badge ambassadeur' }),
    )
  })

  // FDR-0014 §7 always intended FREE_TICKET as a 100%-off code, and
  // FREE_PRODUCT/FREE_PHOTO_PACK joined it 2026-09-27 -- the real reported
  // case (a patch adhésif Overbound won and no code received).
  it('mints and returns a promo code for a FREE_PRODUCT win', async () => {
    supabaseAdminMock.mockReturnValue(
      buildAdmin({
        data: {
          success: true,
          allocation_id: 'alloc-7',
          reward_id: 'reward-7',
          reward_name: 'Patch Overbound offert',
          reward_type: 'FREE_PRODUCT',
          redemption_code: 'ABC789',
          won_at: '2026-09-20T10:00:00Z',
          expires_at: '2026-09-22T10:00:00Z',
        },
        error: null,
      }),
    )

    const response = await POST(buildRequest({ wheel_entry_id: 'aaaaaaaa-1111-4111-8111-111111111111' }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({ success: true, promo_code: 'LWHEEL-ALLOC1A' })
  })

  it('does not send a reward email when the draw has no reward available', async () => {
    supabaseAdminMock.mockReturnValue(
      buildAdmin({ data: { success: false, error: 'NO_REWARD_AVAILABLE' }, error: null }),
    )

    await POST(buildRequest({ wheel_entry_id: 'aaaaaaaa-1111-4111-8111-111111111111' }))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(sendLuckyWheelRewardEmailMock).not.toHaveBeenCalled()
  })

  it('returns a structured NO_REWARD_AVAILABLE result with 200, not an error', async () => {
    supabaseAdminMock.mockReturnValue(
      buildAdmin({ data: { success: false, error: 'NO_REWARD_AVAILABLE' }, error: null }),
    )

    const response = await POST(buildRequest({ wheel_entry_id: 'aaaaaaaa-1111-4111-8111-111111111111' }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({ success: false, error: 'NO_REWARD_AVAILABLE' })
  })

  it('rejects an invalid wheel_entry_id with 400', async () => {
    supabaseAdminMock.mockReturnValue(buildAdmin({ data: null, error: null }))

    const response = await POST(buildRequest({ wheel_entry_id: 'not-a-uuid' }))

    expect(response.status).toBe(400)
  })

  it('returns 409 on a refresh-triggered reroll attempt (ALREADY_SPUN)', async () => {
    supabaseAdminMock.mockReturnValue(
      buildAdmin({ data: null, error: new Error('ALREADY_SPUN: entry entry-1 already spun') }),
    )

    const response = await POST(buildRequest({ wheel_entry_id: 'aaaaaaaa-1111-4111-8111-111111111111' }))
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error).toBe('ALREADY_SPUN')
  })

  it('returns 409 when the campaign was paused between entry and spin', async () => {
    supabaseAdminMock.mockReturnValue(
      buildAdmin({ data: null, error: new Error('CAMPAIGN_UNAVAILABLE: campaign c-1 is disabled or paused') }),
    )

    const response = await POST(buildRequest({ wheel_entry_id: 'aaaaaaaa-1111-4111-8111-111111111111' }))
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error).toBe('CAMPAIGN_UNAVAILABLE')
  })

  it('returns 404 when the wheel entry does not exist', async () => {
    supabaseAdminMock.mockReturnValue(
      buildAdmin({ data: null, error: new Error('WHEEL_ENTRY_NOT_FOUND: entry entry-1 not found') }),
    )

    const response = await POST(buildRequest({ wheel_entry_id: 'aaaaaaaa-1111-4111-8111-111111111111' }))

    expect(response.status).toBe(404)
  })

  it('returns 500 on an unexpected RPC error', async () => {
    supabaseAdminMock.mockReturnValue(buildAdmin({ data: null, error: new Error('connection reset') }))

    const response = await POST(buildRequest({ wheel_entry_id: 'aaaaaaaa-1111-4111-8111-111111111111' }))

    expect(response.status).toBe(500)
  })
})
