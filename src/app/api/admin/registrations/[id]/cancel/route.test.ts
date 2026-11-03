import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  supabaseAdmin: vi.fn(),
  requireAdminOrganization: vi.fn(),
  belongs: vi.fn(),
  cancel: vi.fn(),
  getStripe: vi.fn(),
}))
vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: mocks.supabaseAdmin, createSupabaseServer: vi.fn() }))
vi.mock('@/lib/stripe/server', () => ({ getStripe: mocks.getStripe }))
vi.mock('@/lib/auth/requireAdminOrganization', () => ({ requireAdminOrganization: mocks.requireAdminOrganization }))
vi.mock('@/lib/auth/organizationScope', () => ({ registrationBelongsToOrganization: mocks.belongs }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({ withRequestLogging: (handler: unknown) => handler }))
vi.mock('@/lib/admin/cancelRegistration', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/admin/cancelRegistration')>()),
  cancelRegistrationAsAdmin: mocks.cancel,
}))

import { AdminCancelError } from '@/lib/admin/cancelRegistration'
import { POST } from './route'

const ID = '3f2b8c1e-5d4a-4f6b-9a7c-1e2d3c4b5a69'
const post = (body: unknown) =>
  (POST as unknown as (request: Request, context: { params: Promise<{ id: string }> }) => Promise<Response>)(
    new Request('http://localhost', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }),
    { params: Promise.resolve({ id: ID }) },
  )

describe('POST /api/admin/registrations/[id]/cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireAdminOrganization.mockResolvedValue({ ok: true, user: { id: 'admin-1' }, organizationId: 'org-1', role: 'admin' })
    mocks.belongs.mockResolvedValue(true)
    mocks.supabaseAdmin.mockReturnValue({})
    mocks.cancel.mockResolvedValue({ refundedCents: 4500, currency: 'eur' })
  })

  it('cancels with the reason and the refund choice, as the signed-in admin', async () => {
    const response = await post({ reason: '  Blessure  ', refund: { mode: 'custom', amountCents: 2500 } })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ refundedCents: 4500, currency: 'eur' })
    expect(mocks.cancel).toHaveBeenCalledWith(
      expect.objectContaining({ adminUserId: 'admin-1', registrationId: ID, reason: 'Blessure', refund: { mode: 'custom', amountCents: 2500 } }),
    )
  })

  it.each([
    ['a reason that is too short', { reason: 'ab', refund: { mode: 'none' } }],
    ['no refund choice', { reason: 'Blessure' }],
    ['an unknown refund mode', { reason: 'Blessure', refund: { mode: 'all' } }],
    ['a custom refund of zero', { reason: 'Blessure', refund: { mode: 'custom', amountCents: 0 } }],
    ['a fractional custom refund', { reason: 'Blessure', refund: { mode: 'custom', amountCents: 10.5 } }],
    ['a body that is not JSON', 'nope'],
  ])('answers 400 for %s, without touching Stripe or the database', async (_label, body) => {
    expect((await post(body)).status).toBe(400)
    expect(mocks.cancel).not.toHaveBeenCalled()
    expect(mocks.getStripe).not.toHaveBeenCalled()
  })

  it('answers 404 for a registration of another organization', async () => {
    mocks.belongs.mockResolvedValue(false)
    expect((await post({ reason: 'Blessure', refund: { mode: 'none' } })).status).toBe(404)
    expect(mocks.cancel).not.toHaveBeenCalled()
  })

  it('maps a business failure to its status and code', async () => {
    const failure = new AdminCancelError('CHECKED_IN')
    mocks.cancel.mockRejectedValue(failure)
    const response = await post({ reason: 'Blessure', refund: { mode: 'none' } })
    expect(response.status).toBe(failure.status)
    expect(await response.json()).toEqual({ error: failure.message, code: 'CHECKED_IN' })
  })

  it('answers 500 without leaking an unexpected error', async () => {
    mocks.cancel.mockRejectedValue(new Error('connection refused to db.internal'))
    const response = await post({ reason: 'Blessure', refund: { mode: 'none' } })
    expect(response.status).toBe(500)
    expect(JSON.stringify(await response.json())).not.toContain('db.internal')
  })

  it('refuses a non-admin', async () => {
    mocks.requireAdminOrganization.mockResolvedValue({ ok: false, response: new Response(null, { status: 403 }) })
    expect((await post({ reason: 'Blessure', refund: { mode: 'none' } })).status).toBe(403)
    expect(mocks.cancel).not.toHaveBeenCalled()
  })
})
