import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, requireAdminMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  requireAdminMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({
  withRequestLogging: (handler: any) => handler,
}))

import { GET, POST } from './route'

const VALID_BODY = {
  campaign_id: 'aaaaaaaa-1111-4111-8111-111111111111',
  name: 'Badge ambassadeur',
  type: 'CUSTOM',
  weight: 10,
  stock: 100,
}

function buildRequest(body: unknown, url = 'http://localhost/api/admin/lucky-wheel/rewards') {
  return new Request(url, { method: 'POST', body: JSON.stringify(body) }) as any
}

beforeEach(() => {
  supabaseAdminMock.mockReset()
  requireAdminMock.mockReset()
})

describe('GET /api/admin/lucky-wheel/rewards', () => {
  it('lists rewards, optionally scoped by campaign_id', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
    const chain: any = {
      select: () => chain,
      order: () => chain,
      eq: () => chain,
      then: (resolve: any) => resolve({ data: [{ id: 'reward-1' }], error: null }),
    }
    supabaseAdminMock.mockReturnValue({ from: () => chain })

    const response = await GET(
      buildRequest(null, 'http://localhost/api/admin/lucky-wheel/rewards?campaign_id=campaign-1'),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.rewards).toHaveLength(1)
  })

  it('returns 403 for a non-admin', async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403 }),
    })

    const response = await GET(buildRequest(null))

    expect(response.status).toBe(403)
  })
})

describe('POST /api/admin/lucky-wheel/rewards', () => {
  it('creates a reward on valid input', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
    supabaseAdminMock.mockReturnValue({
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: 'reward-1', ...VALID_BODY }, error: null }),
          }),
        }),
      }),
    })

    const response = await POST(buildRequest(VALID_BODY))
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.reward.id).toBe('reward-1')
  })

  it('rejects an unknown reward type', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
    supabaseAdminMock.mockReturnValue({ from: () => ({}) })

    const response = await POST(buildRequest({ ...VALID_BODY, type: 'NOT_A_TYPE' }))

    expect(response.status).toBe(400)
  })

  it('rejects a probability outside [0,1]', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
    supabaseAdminMock.mockReturnValue({ from: () => ({}) })

    const response = await POST(buildRequest({ ...VALID_BODY, probability: 1.5 }))

    expect(response.status).toBe(400)
  })

  it('returns 403 for a non-admin', async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403 }),
    })

    const response = await POST(buildRequest(VALID_BODY))

    expect(response.status).toBe(403)
  })

  // FDR-0014 addendum (product-line discounts) §3.1, corrected 2026-09-27:
  // PRODUCT_DISCOUNT/PHOTO_DISCOUNT are no longer creatable -- split into
  // explicit percent/fixed variants (see redemption.ts header).
  describe('PRODUCT_PERCENT_DISCOUNT / PHOTO_DISCOUNT target_upsell_id validation', () => {
    const PRODUCT_BODY = {
      campaign_id: 'aaaaaaaa-1111-4111-8111-111111111111',
      name: '20% sur T-shirt finisher',
      type: 'PRODUCT_PERCENT_DISCOUNT',
      weight: 5,
      public_value: 20,
      target_upsell_id: 'bbbbbbbb-2222-4222-8222-222222222222',
    }

    function buildAdminWithReachableUpsell(campaignEventIds: string[], upsellReachable: boolean) {
      return {
        from: (table: string) => {
          if (table === 'lucky_wheel_campaign_events') {
            return { select: () => ({ eq: async () => ({ data: campaignEventIds.map((event_id) => ({ event_id })), error: null }) }) }
          }
          if (table === 'upsells') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    or: () => ({ maybeSingle: async () => ({ data: upsellReachable ? { id: PRODUCT_BODY.target_upsell_id } : null, error: null }) }),
                  }),
                }),
              }),
            }
          }
          if (table === 'lucky_wheel_rewards') {
            return {
              insert: () => ({
                select: () => ({ single: async () => ({ data: { id: 'reward-1', ...PRODUCT_BODY }, error: null }) }),
              }),
            }
          }
          throw new Error(`Unexpected table: ${table}`)
        },
      }
    }

    it('creates a PRODUCT_PERCENT_DISCOUNT reward when its target upsell is reachable on a campaign event', async () => {
      requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
      supabaseAdminMock.mockReturnValue(buildAdminWithReachableUpsell(['event-1'], true))

      const response = await POST(buildRequest(PRODUCT_BODY))
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.reward.id).toBe('reward-1')
    })

    it('rejects a PRODUCT_PERCENT_DISCOUNT reward missing target_upsell_id', async () => {
      requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
      supabaseAdminMock.mockReturnValue({ from: () => ({}) })

      const response = await POST(buildRequest({ ...PRODUCT_BODY, target_upsell_id: undefined }))
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toMatch(/target_upsell_id est requis/)
    })

    it('rejects a PRODUCT_PERCENT_DISCOUNT reward whose target upsell is not sold on any campaign event', async () => {
      requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
      supabaseAdminMock.mockReturnValue(buildAdminWithReachableUpsell(['event-1'], false))

      const response = await POST(buildRequest(PRODUCT_BODY))
      const json = await response.json()

      expect(response.status).toBe(422)
      expect(json.error).toMatch(/aucun événement/)
    })

    // The real reported bug: the old unsuffixed type is ambiguous and must
    // never be creatable for a new reward again.
    it('rejects creating a new reward with the legacy unsuffixed PRODUCT_DISCOUNT type', async () => {
      requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
      supabaseAdminMock.mockReturnValue({ from: () => ({}) })

      const response = await POST(buildRequest({ ...PRODUCT_BODY, type: 'PRODUCT_DISCOUNT' }))
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toMatch(/ambigu/)
    })

    it('creates a PRODUCT_FIXED_DISCOUNT reward (the real reported case: fixed amount, not percent)', async () => {
      requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
      supabaseAdminMock.mockReturnValue(buildAdminWithReachableUpsell(['event-1'], true))

      const response = await POST(buildRequest({ ...PRODUCT_BODY, type: 'PRODUCT_FIXED_DISCOUNT', public_value: 5 }))
      const json = await response.json()

      expect(response.status).toBe(201)
    })

    // FDR-0014 §7 always intended FREE_TICKET as a 100%-off code, and
    // FREE_PRODUCT/FREE_PHOTO_PACK joined it 2026-09-27 -- the real
    // reported case (a patch adhésif Overbound won and no code received).
    it('creates a FREE_PRODUCT reward when its target upsell is reachable on a campaign event', async () => {
      requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
      supabaseAdminMock.mockReturnValue(buildAdminWithReachableUpsell(['event-1'], true))

      const response = await POST(buildRequest({ ...PRODUCT_BODY, type: 'FREE_PRODUCT', public_value: null }))
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.reward.id).toBe('reward-1')
    })

    it('rejects a FREE_PRODUCT reward missing target_upsell_id', async () => {
      requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
      supabaseAdminMock.mockReturnValue({ from: () => ({}) })

      const response = await POST(
        buildRequest({ ...PRODUCT_BODY, type: 'FREE_PRODUCT', target_upsell_id: undefined }),
      )
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toMatch(/target_upsell_id est requis/)
    })
  })
})
