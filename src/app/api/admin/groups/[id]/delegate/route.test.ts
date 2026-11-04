import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireAdminMock, supabaseAdminMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))
vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))

import { POST } from './route'

const GROUP_ID = '2b3c4d5e-6f70-4812-9a3b-4c5d6e7f8091'
const params = { params: Promise.resolve({ id: GROUP_ID }) }

const request = (body: string) =>
  new Request(`http://localhost/api/admin/groups/${GROUP_ID}/delegate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
  supabaseAdminMock.mockReturnValue({ from: vi.fn() })
})

describe('POST /api/admin/groups/[id]/delegate', () => {
  it('answers 400 and touches no group when the body is not JSON', async () => {
    const response = await POST(request('{pas du json') as never, params)

    expect(response.status).toBe(400)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('answers 400 when the new captain id is not a uuid', async () => {
    const response = await POST(request(JSON.stringify({ new_captain_id: 'abc' })) as never, params)

    expect(response.status).toBe(400)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })
})
