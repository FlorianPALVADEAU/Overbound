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

import { POST } from './route'

function buildRequest(body: unknown) {
  return new Request('http://localhost/api/admin/lucky-wheel/campaigns/campaign-1/pause', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as any
}

const params = Promise.resolve({ id: 'campaign-1' })

beforeEach(() => {
  supabaseAdminMock.mockReset()
  requireAdminMock.mockReset()
})

describe('POST /api/admin/lucky-wheel/campaigns/[id]/pause', () => {
  it('pauses the campaign, touching only the paused field', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
    const updateSpy = vi.fn(() => ({
      eq: () => ({
        select: () => ({
          single: async () => ({
            data: { id: 'campaign-1', name: 'Lancement', enabled: true, paused: true },
            error: null,
          }),
        }),
      }),
    }))
    supabaseAdminMock.mockReturnValue({
      from: () => ({ update: updateSpy }),
    })

    const response = await POST(buildRequest({ paused: true }), { params })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.campaign.paused).toBe(true)
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ paused: true }),
    )
  })

  it('resumes a paused campaign', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
    supabaseAdminMock.mockReturnValue({
      from: () => ({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({
                data: { id: 'campaign-1', name: 'Lancement', enabled: true, paused: false },
                error: null,
              }),
            }),
          }),
        }),
      }),
    })

    const response = await POST(buildRequest({ paused: false }), { params })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.campaign.paused).toBe(false)
  })

  it('rejects a non-boolean paused value', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
    supabaseAdminMock.mockReturnValue({ from: () => ({}) })

    const response = await POST(buildRequest({ paused: 'yes' }), { params })

    expect(response.status).toBe(400)
  })

  it('returns 403 for a non-admin', async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403 }),
    })

    const response = await POST(buildRequest({ paused: true }), { params })

    expect(response.status).toBe(403)
  })
})
