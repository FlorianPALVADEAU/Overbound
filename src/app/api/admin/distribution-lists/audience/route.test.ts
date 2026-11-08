import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), resolve: vi.fn() }))

vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: mocks.requireAdmin }))
vi.mock('@/lib/email/segmentedAudience', () => ({ resolveSegmentedAudience: mocks.resolve }))

import { POST } from './route'

const request = (body: unknown) =>
  new Request('http://localhost/api/admin/distribution-lists/audience', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as never

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireAdmin.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
  mocks.resolve.mockResolvedValue([{ email: 'a@x.fr' }, { email: 'b@x.fr' }])
})

describe('POST /api/admin/distribution-lists/audience', () => {
  it('returns the number of addresses the send would reach', async () => {
    const response = await POST(request({ listIds: ['l1'], segment: 'registered' }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ count: 2 })
    expect(mocks.resolve).toHaveBeenCalledWith({ listIds: ['l1'], segment: 'registered' })
  })

  it('refuses a non-admin before resolving anything', async () => {
    mocks.requireAdmin.mockResolvedValue({ ok: false, response: new Response(null, { status: 403 }) })

    const response = await POST(request({ listIds: ['l1'] }))

    expect(response.status).toBe(403)
    expect(mocks.resolve).not.toHaveBeenCalled()
  })

  it('refuses an empty list selection and an unknown segment', async () => {
    expect((await POST(request({ listIds: [] }))).status).toBe(400)
    expect((await POST(request({ listIds: ['l1'], segment: 'nope' }))).status).toBe(400)
    expect(mocks.resolve).not.toHaveBeenCalled()
  })

  it('reports a failure instead of a misleading count', async () => {
    mocks.resolve.mockRejectedValue(new Error('down'))

    const response = await POST(request({ listIds: ['l1'] }))

    expect(response.status).toBe(500)
  })
})
