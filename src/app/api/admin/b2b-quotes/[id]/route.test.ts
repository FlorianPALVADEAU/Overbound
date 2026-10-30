import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, requireAdminMock } = vi.hoisted(() => ({ supabaseAdminMock: vi.fn(), requireAdminMock: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: supabaseAdminMock,
  createSupabaseServer: vi.fn(),
}))
vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({ withRequestLogging: (handler: unknown) => handler }))

import { PATCH } from './route'

const ID = '3f2b8c1e-5d4a-4f6b-9a7c-1e2d3c4b5a69'
const patch = (body: unknown, id = ID) =>
  PATCH(new Request('http://localhost', { method: 'PATCH', body: JSON.stringify(body) }) as never, { params: Promise.resolve({ id }) })

describe('PATCH /api/admin/b2b-quotes/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin' } })
  })

  it('updates the status', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: ID, status: 'quoted' }, error: null })
    const eq = vi.fn(() => ({ select: () => ({ maybeSingle }) }))
    const update = vi.fn(() => ({ eq }))
    supabaseAdminMock.mockReturnValue({ from: () => ({ update }) })

    const response = await patch({ status: 'quoted' })
    expect(response.status).toBe(200)
    expect(update).toHaveBeenCalledWith({ status: 'quoted' })
    expect(eq).toHaveBeenCalledWith('id', ID)
  })

  it('rejects an unknown status', async () => {
    expect((await patch({ status: 'archived' })).status).toBe(400)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('answers 404 when the request does not exist', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    supabaseAdminMock.mockReturnValue({ from: () => ({ update: () => ({ eq: () => ({ select: () => ({ maybeSingle }) }) }) }) })
    expect((await patch({ status: 'won' })).status).toBe(404)
  })
})
