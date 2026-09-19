import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireAdminMock, createSupabaseServerMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  createSupabaseServerMock: vi.fn(),
}))

vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))
vi.mock('@/lib/supabase/server', () => ({ createSupabaseServer: createSupabaseServerMock }))

import { requireAdminOrganization } from './requireAdminOrganization'

const request = (url = 'https://example.test/api/admin/events') => new Request(url)

function mockMemberships(rows: Array<{ organization_id: string; role: string; status: string }>) {
  createSupabaseServerMock.mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: async () => ({ data: rows, error: null }),
        }),
      }),
    }),
  })
}

describe('requireAdminOrganization', () => {
  beforeEach(() => {
    requireAdminMock.mockReset()
    createSupabaseServerMock.mockReset()
  })

  it('resolves the only active membership', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'user-1' } })
    mockMemberships([{ organization_id: 'org-1', role: 'owner', status: 'active' }])

    const result = await requireAdminOrganization(request())

    expect(result).toMatchObject({ ok: true, organizationId: 'org-1', role: 'owner' })
  })

  it('requires an explicit organization when several memberships exist', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'user-1' } })
    mockMemberships([
      { organization_id: 'org-1', role: 'admin', status: 'active' },
      { organization_id: 'org-2', role: 'admin', status: 'active' },
    ])

    const result = await requireAdminOrganization(request())

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(409)
  })

  it('rejects an organization outside the active memberships', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'user-1' } })
    mockMemberships([{ organization_id: 'org-1', role: 'admin', status: 'active' }])

    const result = await requireAdminOrganization(request(`${request().url}?organization=org-2`))

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })
})
