import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, requireAdminOrganizationMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  requireAdminOrganizationMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/auth/requireAdminOrganization', () => ({ requireAdminOrganization: requireAdminOrganizationMock }))

import { GET } from './route'

const USER_ID = '56e08f7d-24c3-44be-b123-4f034c669909'

function queryFor(data: unknown) {
  const query: any = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    not: vi.fn(() => query),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data, error: null })),
  }
  return query
}

function createAdminMock() {
  const admin = {
    from: vi.fn((table: string) => {
      if (table === 'events') return queryFor([{ id: 'event-1' }])
      if (table === 'registrations') return queryFor([{ user_id: USER_ID }])
      if (table === 'group_members') {
        const select = vi.fn((fields: string) => fields.includes('group:groups')
          ? queryFor([{ profile_id: USER_ID, group: { id: 'group-1', name: 'Team', invite_code: 'TEAM' } }])
          : queryFor([{ profile_id: USER_ID }]))
        return { select }
      }
      if (table === 'profiles') return queryFor([{ id: USER_ID, full_name: 'Test User', role: 'user', phone: null, created_at: '2026-01-01T00:00:00.000Z', date_of_birth: null, marketing_opt_in: true }])
      if (table === 'ambassadors') return queryFor([])
      throw new Error(`Unexpected table: ${table}`)
    }),
    auth: { admin: { listUsers: vi.fn().mockResolvedValue({ data: { users: [{ id: USER_ID, email: 'test@example.com', created_at: '2026-01-01T00:00:00.000Z', last_sign_in_at: null }] }, error: null }) } },
  }
  return admin
}

describe('GET /api/admin/users paginated listing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminOrganizationMock.mockResolvedValue({ ok: true, organizationId: 'org-1', user: { id: USER_ID } })
  })

  it('returns a page without exposing the full auth scan', async () => {
    const admin = createAdminMock()
    supabaseAdminMock.mockReturnValue(admin)

    const response = await GET(new Request('http://localhost/api/admin/users?paginated=true&limit=25&role=user') as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.users).toHaveLength(1)
    expect(body.users[0]).toMatchObject({ id: USER_ID, full_name: 'Test User' })
    expect(body.page).toMatchObject({ limit: 25, totalCount: 1, nextCursor: null })
  })

  it('rejects invalid cursors before scanning Auth users', async () => {
    const admin = createAdminMock()
    supabaseAdminMock.mockReturnValue(admin)

    const response = await GET(new Request('http://localhost/api/admin/users?paginated=true&cursor=not-a-cursor') as any)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Cursor de pagination invalide' })
    expect(admin.auth.admin.listUsers).not.toHaveBeenCalled()
  })

  it('rejects invalid limits', async () => {
    const response = await GET(new Request('http://localhost/api/admin/users?paginated=true&limit=5') as any)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Paramètres de liste invalides' })
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })
})
