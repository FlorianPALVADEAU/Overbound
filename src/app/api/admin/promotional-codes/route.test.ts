import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, requireAdminMock } = vi.hoisted(() => ({ supabaseAdminMock: vi.fn(), requireAdminMock: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({ withRequestLogging: (handler: unknown) => handler }))
vi.mock('@/lib/email/marketing', () => ({}))

import { GET } from './route'

describe('GET /api/admin/promotional-codes paginated listing', () => {
  beforeEach(() => { vi.clearAllMocks(); requireAdminMock.mockResolvedValue({ ok: true }) })

  it('returns paginated promotional codes', async () => {
    const rows = [{ id: '56e08f7d-24c3-44be-b123-4f034c669909', code: 'RUN10', name: 'Run 10', created_at: '2026-09-01T00:00:00.000Z', valid_from: '2026-09-01T00:00:00.000Z', valid_until: '2026-10-01T00:00:00.000Z', is_active: true, events: [] }]
    const query: any = { eq: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: rows, count: 1, error: null }) }
    supabaseAdminMock.mockReturnValue({ from: vi.fn(() => ({ select: vi.fn(() => query) })) })
    const response = await GET(new Request('http://localhost/api/admin/promotional-codes?paginated=true&limit=25') as any)
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.promotionalCodes).toHaveLength(1)
    expect(body.page).toMatchObject({ limit: 25, totalCount: 1, nextCursor: null })
  })

  it('rejects an invalid cursor', async () => {
    const response = await GET(new Request('http://localhost/api/admin/promotional-codes?paginated=true&cursor=nope') as any)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Cursor de pagination invalide' })
    expect(requireAdminMock).toHaveBeenCalledTimes(1)
  })
})
