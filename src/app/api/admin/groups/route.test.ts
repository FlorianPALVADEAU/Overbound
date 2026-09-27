import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, requireAdminOrganizationMock } = vi.hoisted(() => ({ supabaseAdminMock: vi.fn(), requireAdminOrganizationMock: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/auth/requireAdminOrganization', () => ({ requireAdminOrganization: requireAdminOrganizationMock }))

import { GET } from './route'

const ORG = '56e08f7d-24c3-44be-b123-4f034c669909'
const GROUP = '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'
const PROFILE = '3d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'

describe('GET /api/admin/groups pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminOrganizationMock.mockResolvedValue({ ok: true, organizationId: ORG, user: { id: 'admin' }, role: 'admin' })
  })

  it('returns page metadata and global member profile ids', async () => {
    const chain: any = { eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockResolvedValue({ data: [{ id: GROUP, name: 'Loups', captain_id: PROFILE, invite_code: 'LOUPS', anchor_event_id: null, anchor_wave_index: null, anchor_start_time: null, anchor_initialized_by: null, anchor_initialized_from_profile_id: null, anchor_initialized_at: null, created_at: '2026-01-01' }], count: 1, error: null }) }
    const memberChain: any = { eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [{ id: 'm', group_id: GROUP, profile_id: PROFILE, role: 'captain', joined_at: '2026-01-01' }], error: null }) }
    const globalMembersChain: any = { eq: vi.fn().mockResolvedValue({ data: [{ profile_id: PROFILE }], error: null }) }
    let groupMemberCalls = 0
    const admin = { from: vi.fn((table: string) => table === 'groups' ? { select: vi.fn().mockReturnValue(chain) } : table === 'group_members' ? { select: vi.fn().mockReturnValue(++groupMemberCalls === 1 ? globalMembersChain : memberChain) } : { select: vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({ data: [{ id: PROFILE, full_name: 'Camille' }], error: null }) }) }), auth: { admin: { listUsers: vi.fn().mockResolvedValue({ data: { users: [{ id: PROFILE, email: 'camille@example.com' }] } }) } } }
    supabaseAdminMock.mockReturnValue(admin)
    const response = await GET(new Request('http://localhost/api/admin/groups?paginated=true&limit=25'))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.page).toMatchObject({ limit: 25, totalCount: 1, nextCursor: null })
    expect(body.memberProfileIds).toEqual([PROFILE])
  })

  it('rejects invalid cursor before database access', async () => {
    const response = await GET(new Request('http://localhost/api/admin/groups?paginated=true&cursor=invalid'))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Cursor de pagination invalide' })
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })
})
