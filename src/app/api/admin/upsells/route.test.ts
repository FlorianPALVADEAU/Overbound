import { beforeEach, describe, expect, it, vi } from 'vitest'
const { supabaseAdminMock, requireAdminMock } = vi.hoisted(() => ({ supabaseAdminMock: vi.fn(), requireAdminMock: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))
import { GET } from './route'

describe('GET /api/admin/upsells pagination', () => {
  beforeEach(() => { vi.clearAllMocks(); requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin' } }) })
  it('returns a paginated response while preserving upsells', async () => {
    const query: any = { or: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockResolvedValue({ data: [{ id: 'u1', name: 'T-shirt', price_cents: 1000 }], count: 1, error: null }) }
    supabaseAdminMock.mockReturnValue({ from: vi.fn(() => ({ select: vi.fn().mockReturnValue(query) })) })
    const response = await GET(new Request('http://localhost/api/admin/upsells?paginated=true&limit=25&status=active&query=shirt') as any)
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.upsells).toHaveLength(1)
    expect(body.page).toEqual({ limit: 25, totalCount: 1, nextCursor: null })
  })
  it('rejects invalid pagination parameters', async () => {
    const response = await GET(new Request('http://localhost/api/admin/upsells?paginated=true&limit=10') as any)
    expect(response.status).toBe(400)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })
})
