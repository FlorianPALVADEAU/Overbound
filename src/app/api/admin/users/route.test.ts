import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, requireAdminOrganizationMock, rpcMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  requireAdminOrganizationMock: vi.fn(),
  rpcMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/auth/requireAdminOrganization', () => ({ requireAdminOrganization: requireAdminOrganizationMock }))

import { GET } from './route'
import { encodeAdminUsersCursor } from '@/lib/admin/usersList'

const ADMIN_ID = '56e08f7d-24c3-44be-b123-4f034c669909'

function row(index: number, filteredCount: number) {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    email: `user${index}@example.com`,
    created_at: '2026-01-01T00:00:00.000Z',
    last_sign_in_at: null,
    first_name: `Prénom ${index}`,
    last_name: `Nom ${index}`,
    role: 'user',
    phone: null,
    profile_created_at: '2026-01-01T00:00:00.000Z',
    date_of_birth: null,
    marketing_opt_in: true,
    ambassador_promotional_code_id: null,
    ambassador_code: null,
    ambassador_code_is_active: null,
    group_id: null,
    group_name: null,
    group_invite_code: null,
    filtered_count: filteredCount,
  }
}

function listRequest(query: string) {
  return new Request(`http://localhost/api/admin/users?${query}`) as any
}

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminOrganizationMock.mockResolvedValue({ ok: true, organizationId: 'org-1', user: { id: ADMIN_ID } })
  supabaseAdminMock.mockReturnValue({ rpc: rpcMock, auth: { admin: { listUsers: vi.fn() } }, from: vi.fn() })
})

describe('GET /api/admin/users', () => {
  it('asks the database for one page with filters, sort and offset, and never scans Auth', async () => {
    rpcMock.mockResolvedValue({ data: [row(1, 120)], error: null })

    const response = await GET(listRequest('paginated=true&limit=25&role=admin&query=Jean%20Dupont&sort=email&direction=asc'))

    expect(response.status).toBe(200)
    expect(rpcMock).toHaveBeenCalledWith('admin_list_users', {
      p_query: 'jean dupont',
      p_role: 'admin',
      p_sort: 'email',
      p_direction: 'asc',
      p_offset: 0,
      p_limit: 25,
    })
    expect(supabaseAdminMock().auth.admin.listUsers).not.toHaveBeenCalled()
  })

  it('returns the filtered count and a cursor pointing at the next offset', async () => {
    rpcMock.mockResolvedValue({ data: [row(1, 120), row(2, 120)], error: null })

    const response = await GET(listRequest('paginated=true&limit=25'))
    const body = await response.json()

    expect(body.users).toHaveLength(2)
    expect(body.users[0]).not.toHaveProperty('filtered_count')
    expect(body.page).toMatchObject({ limit: 25, totalCount: 120 })
    expect(body.page.nextCursor).toBe(encodeAdminUsersCursor({ sort: 'created_at', direction: 'desc', offset: 2 }))
  })

  it('returns no next cursor on the last page', async () => {
    rpcMock.mockResolvedValue({ data: [row(3, 3)], error: null })
    const cursor = encodeAdminUsersCursor({ sort: 'created_at', direction: 'desc', offset: 2 })

    const response = await GET(listRequest(`paginated=true&limit=25&cursor=${cursor}`))
    const body = await response.json()

    expect(rpcMock).toHaveBeenCalledWith('admin_list_users', expect.objectContaining({ p_offset: 2 }))
    expect(body.page).toMatchObject({ totalCount: 3, nextCursor: null })
  })

  it('answers an empty result with no next cursor', async () => {
    rpcMock.mockResolvedValue({ data: [], error: null })

    const response = await GET(listRequest('paginated=true&limit=25&query=zzz'))
    const body = await response.json()

    expect(body.users).toEqual([])
    expect(body.page).toMatchObject({ totalCount: 0, nextCursor: null })
  })

  it('returns every account without paging when the list is not paginated', async () => {
    rpcMock.mockResolvedValue({ data: [row(1, 2), row(2, 2)], error: null })

    const response = await GET(listRequest(''))
    const body = await response.json()

    expect(rpcMock).toHaveBeenCalledWith('admin_list_users', expect.objectContaining({ p_limit: null, p_offset: 0 }))
    expect(body).toEqual({ users: [expect.objectContaining({ first_name: 'Prénom 1' }), expect.objectContaining({ first_name: 'Prénom 2' })], total: 2 })
  })

  it('rejects a cursor built for another sort before calling the database', async () => {
    const cursor = encodeAdminUsersCursor({ sort: 'email', direction: 'desc', offset: 10 })

    const response = await GET(listRequest(`paginated=true&cursor=${cursor}`))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Cursor de pagination incompatible' })
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid cursor before calling the database', async () => {
    const response = await GET(listRequest('paginated=true&cursor=not-a-cursor'))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Cursor de pagination invalide' })
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('rejects invalid limits', async () => {
    const response = await GET(listRequest('paginated=true&limit=5'))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Paramètres de liste invalides' })
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('answers 500 without leaking the database message when the function fails', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'permission denied for function admin_list_users' } })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await GET(listRequest('paginated=true&limit=25'))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Erreur serveur' })
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
