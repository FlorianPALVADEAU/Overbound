import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, requireAdminMock } = vi.hoisted(() => ({ supabaseAdminMock: vi.fn(), requireAdminMock: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))

import { GET } from './route'

const get = (search = '') => GET(new Request(`http://localhost/api/admin/b2b-quotes${search}`) as never)

describe('GET /api/admin/b2b-quotes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin' } })
  })

  it('lists requests newest first with the page info', async () => {
    const query = {
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [{ id: 'a', company_name: 'Acme' }], count: 1, error: null }),
    }
    supabaseAdminMock.mockReturnValue({ from: () => ({ select: () => query }) })

    const response = await get('?status=new&query=acme')
    expect(response.status).toBe(200)
    expect(query.eq).toHaveBeenCalledWith('status', 'new')
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(await response.json()).toMatchObject({ requests: [{ id: 'a' }], page: { totalCount: 1, nextCursor: null } })
  })

  it('refuses a non-admin before touching the database', async () => {
    requireAdminMock.mockResolvedValue({ ok: false, response: Response.json({ error: 'Accès refusé' }, { status: 403 }) })
    expect((await get()).status).toBe(403)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('rejects an unknown status filter', async () => {
    expect((await get('?status=archived')).status).toBe(400)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })
})
