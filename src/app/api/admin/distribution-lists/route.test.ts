import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { createClientMock, supabaseAdminMock, requireAdminMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  requireAdminMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: createClientMock, supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))

import { GET } from './route'

const ROW = { id: 'list-1', name: 'Marketing', slug: 'marketing', type: 'marketing', active: true, subscriber_count: 12, created_at: '2026-01-01T00:00:00Z' }

function createAdminMock() {
  const listQuery: any = {
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: [ROW], count: 1, error: null }),
  }
  const eventQuery: any = {
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
  const admin = {
    from: vi.fn((table: string) => table === 'distribution_lists_stats'
      ? { select: vi.fn().mockReturnValue(listQuery) }
      : { select: vi.fn().mockReturnValue(eventQuery) }),
    listQuery,
  }
  return admin
}

describe('GET /api/admin/distribution-lists pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
    createClientMock.mockResolvedValue({})
  })

  it('returns a paginated stats list', async () => {
    const admin = createAdminMock()
    supabaseAdminMock.mockReturnValue(admin)
    const response = await GET(new NextRequest('http://localhost/api/admin/distribution-lists?includeStats=true&limit=25&search=market'))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.nextCursor).toBeNull()
    expect(admin.listQuery.range).toHaveBeenCalledWith(0, 24)
  })

  it('rejects invalid pagination parameters', async () => {
    const response = await GET(new NextRequest('http://localhost/api/admin/distribution-lists?includeStats=true&limit=0'))
    expect(response.status).toBe(422)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid cursor before querying Supabase', async () => {
    const response = await GET(new NextRequest('http://localhost/api/admin/distribution-lists?includeStats=true&cursor=invalid'))
    expect(response.status).toBe(422)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })
})
