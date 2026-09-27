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
  name: 'Lancement Ultra Arena',
  starts_at: '2026-09-01T00:00:00Z',
  ends_at: '2026-09-30T00:00:00Z',
  event_ids: ['aaaaaaaa-1111-4111-8111-111111111111'],
}

function buildRequest(body: unknown) {
  return new Request('http://localhost/api/admin/lucky-wheel/campaigns', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as any
}

beforeEach(() => {
  supabaseAdminMock.mockReset()
  requireAdminMock.mockReset()
})

describe('GET /api/admin/lucky-wheel/campaigns', () => {
  it('returns 403 for a non-admin', async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403 }),
    })

    const response = await GET(buildRequest(null))

    expect(response.status).toBe(403)
  })

  it('lists campaigns for an admin', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
    supabaseAdminMock.mockReturnValue({
      from: () => ({
        select: () => ({
          order: async () => ({ data: [{ id: 'campaign-1' }], error: null }),
        }),
      }),
    })

    const response = await GET(buildRequest(null))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.campaigns).toHaveLength(1)
  })

  it('returns a paginated contract', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
    const chain: any = { select: () => chain, order: () => chain, range: async () => ({ data: [{ id: 'campaign-1' }], error: null }) }
    supabaseAdminMock.mockReturnValue({ from: () => chain })
    const response = await GET(new Request('http://localhost/api/admin/lucky-wheel/campaigns?paginated=true&limit=1') as any)
    const json = await response.json()
    expect(response.status).toBe(200)
    expect(json.campaigns).toHaveLength(1)
    expect(json.page).toMatchObject({ limit: 1, totalCount: 1 })
  })

  it('rejects an invalid cursor before database access', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
    const response = await GET(new Request('http://localhost/api/admin/lucky-wheel/campaigns?paginated=true&cursor=invalid') as any)
    expect(response.status).toBe(400)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })
})

describe('POST /api/admin/lucky-wheel/campaigns', () => {
  it('creates a campaign with its event links on valid input', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
    const insertedCampaign = { id: 'campaign-1', ...VALID_BODY }
    supabaseAdminMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'lucky_wheel_campaigns') {
          return {
            insert: () => ({
              select: () => ({
                single: async () => ({ data: insertedCampaign, error: null }),
              }),
            }),
            select: () => ({
              eq: () => ({
                single: async () => ({ data: { ...insertedCampaign, events: [], rewards: [] }, error: null }),
              }),
            }),
          }
        }
        if (table === 'lucky_wheel_campaign_events') {
          return { insert: async () => ({ error: null }) }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    })

    const response = await POST(buildRequest(VALID_BODY))
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.campaign.id).toBe('campaign-1')
  })

  it('rejects a campaign with no event_ids', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
    supabaseAdminMock.mockReturnValue({ from: () => ({}) })

    const response = await POST(buildRequest({ ...VALID_BODY, event_ids: [] }))

    expect(response.status).toBe(400)
  })

  it('rejects starts_at after ends_at', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
    supabaseAdminMock.mockReturnValue({ from: () => ({}) })

    const response = await POST(
      buildRequest({ ...VALID_BODY, starts_at: '2026-09-30T00:00:00Z', ends_at: '2026-09-01T00:00:00Z' }),
    )

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
})
