import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireAdminMock, supabaseAdminMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))
vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))

import { POST } from './route'

const request = (body: string) =>
  new Request('http://localhost/api/admin/groups/from-promocode', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
  supabaseAdminMock.mockReturnValue({ from: vi.fn() })
})

describe('POST /api/admin/groups/from-promocode', () => {
  it('answers 400 and creates nothing when the body is not JSON', async () => {
    const response = await POST(request('{pas du json') as never)

    expect(response.status).toBe(400)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('answers 400 when the captain id is missing', async () => {
    const response = await POST(request(JSON.stringify({ name: 'Équipe', promotional_code: 'ACME' })) as never)

    expect(response.status).toBe(400)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })
})
