import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireAdminOrganizationMock, supabaseAdminMock, rpcMock } = vi.hoisted(() => ({
  requireAdminOrganizationMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  rpcMock: vi.fn(),
}))

vi.mock('@/lib/auth/requireAdminOrganization', () => ({ requireAdminOrganization: requireAdminOrganizationMock }))
vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))

import { POST } from './route'

const GROUP_ID = '2b3c4d5e-6f70-4812-9a3b-4c5d6e7f8091'
const CAPTAIN_ID = '7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d'
const ORG_ID = 'org-1'
const params = { params: Promise.resolve({ id: GROUP_ID }) }

const request = (body: string) =>
  new Request(`http://localhost/api/admin/groups/${GROUP_ID}/delegate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminOrganizationMock.mockResolvedValue({ ok: true, organizationId: ORG_ID, user: { id: 'admin-1' } })
  supabaseAdminMock.mockReturnValue({ rpc: rpcMock, from: vi.fn() })
})

describe('POST /api/admin/groups/[id]/delegate', () => {
  it('answers 400 and touches no group when the body is not JSON', async () => {
    const response = await POST(request('{pas du json') as never, params)

    expect(response.status).toBe(400)
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('answers 400 when the new captain id is not a uuid', async () => {
    const response = await POST(request(JSON.stringify({ new_captain_id: 'abc' })) as never, params)

    expect(response.status).toBe(400)
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('changes captain in one scoped RPC call', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null })

    const response = await POST(request(JSON.stringify({ new_captain_id: CAPTAIN_ID })) as never, params)

    expect(response.status).toBe(200)
    expect(rpcMock).toHaveBeenCalledTimes(1)
    expect(rpcMock).toHaveBeenCalledWith('admin_set_group_captain', {
      p_group_id: GROUP_ID,
      p_captain_id: CAPTAIN_ID,
      p_organization_id: ORG_ID,
    })
  })

  it('answers 400 when the target is not a member of the group', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: '23514', message: 'CAPTAIN_NOT_MEMBER' } })

    const response = await POST(request(JSON.stringify({ new_captain_id: CAPTAIN_ID })) as never, params)

    expect(response.status).toBe(400)
  })

  it('answers 404 when the group is outside the caller organization', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: 'P0002', message: 'GROUP_NOT_FOUND' } })

    const response = await POST(request(JSON.stringify({ new_captain_id: CAPTAIN_ID })) as never, params)

    expect(response.status).toBe(404)
  })

  it('answers 500 without leaking the database message on any other failure', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'boom internal' } })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await POST(request(JSON.stringify({ new_captain_id: CAPTAIN_ID })) as never, params)

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Erreur délégation' })
    errorSpy.mockRestore()
  })
})
