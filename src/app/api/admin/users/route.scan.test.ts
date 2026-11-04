import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, requireAdminOrganizationMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  requireAdminOrganizationMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/auth/requireAdminOrganization', () => ({ requireAdminOrganization: requireAdminOrganizationMock }))

import { GET } from './route'

const ADMIN_ID = '00000000-0000-4000-8000-000000000000'
// Enough accounts that the old per-100-ids lookups would have needed about 3 sequential rounds each.
const USER_IDS = Array.from({ length: 250 }, (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`)

function buildAdmin(options: { profilesError?: { message: string } | null } = {}) {
  const profilesCalls: string[] = []
  const admin = {
    from: vi.fn((table: string) => {
      const query: any = {
        select: vi.fn(() => query),
        order: vi.fn(() => query),
        range: vi.fn((from: number, to: number) => {
          profilesCalls.push(`range:${from}-${to}`)
          query.window = [from, to]
          return query
        }),
        in: vi.fn(() => {
          throw new Error('the list must not look up ids with `in` any more')
        }),
        then: (resolve: (value: unknown) => unknown) => {
          if (table !== 'profiles') return Promise.resolve(resolve({ data: [], error: null }))
          if (options.profilesError) return Promise.resolve(resolve({ data: null, error: options.profilesError }))
          const [from, to] = query.window as [number, number]
          const rows = USER_IDS.slice(from, to + 1).map((id) => ({
            id,
            full_name: `Nom ${id.slice(-4)}`,
            role: id === ADMIN_ID ? 'admin' : 'user',
            phone: null,
            created_at: '2026-01-01T00:00:00.000Z',
            date_of_birth: null,
            marketing_opt_in: null,
            ambassadors: null,
            group_members: [],
          }))
          return Promise.resolve(resolve({ data: rows, error: null }))
        },
      }
      return query
    }),
    auth: {
      admin: {
        listUsers: vi.fn().mockResolvedValue({
          data: {
            users: USER_IDS.map((id) => ({ id, email: `${id.slice(-4)}@example.com`, created_at: '2026-01-01T00:00:00.000Z', last_sign_in_at: null })),
          },
          error: null,
        }),
      },
    },
  }
  return { admin, profilesCalls }
}

describe('GET /api/admin/users scan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminOrganizationMock.mockResolvedValue({ ok: true, organizationId: 'org-1', user: { id: ADMIN_ID } })
  })

  it('reads every profile in one ordered scan, so every account keeps its role and name', async () => {
    const { admin, profilesCalls } = buildAdmin()
    supabaseAdminMock.mockReturnValue(admin)

    const response = await GET(new Request('http://localhost/api/admin/users?paginated=true&limit=100&role=admin') as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(profilesCalls).toEqual(['range:0-999'])
    expect(body.users).toHaveLength(1)
    expect(body.users[0]).toMatchObject({ id: ADMIN_ID, role: 'admin' })
    expect(body.users[0].full_name).toMatch(/^Nom /)
  })

  it('fails with a 500 instead of returning every account as "user" when the scan errors', async () => {
    const { admin } = buildAdmin({ profilesError: { message: 'Bad Request' } })
    supabaseAdminMock.mockReturnValue(admin)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await GET(new Request('http://localhost/api/admin/users?paginated=true&limit=100') as any)

    expect(response.status).toBe(500)
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
