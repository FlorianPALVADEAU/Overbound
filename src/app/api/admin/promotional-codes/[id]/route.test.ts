import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, requireAdminMock } = vi.hoisted(() => ({ supabaseAdminMock: vi.fn(), requireAdminMock: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock, createSupabaseServer: vi.fn() }))
vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({ withRequestLogging: (handler: unknown) => handler }))

import { PUT } from './route'

const ID = '3f2b8c1e-5d4a-4f6b-9a7c-1e2d3c4b5a69'
const EVENT = '7a1d2c3b-4e5f-4a6b-8c7d-9e0f1a2b3c4d'
const valid = { code: 'AMIS10', name: 'Amis', discount_percent: 10, valid_from: '2026-11-01T00:00', valid_until: '2027-01-01T00:00', event_ids: [EVENT] }

const put = (body: unknown) =>
  (PUT as unknown as (request: Request, context: { params: Promise<{ id: string }> }) => Promise<Response>)(
    new Request('http://localhost', { method: 'PUT', body: JSON.stringify(body) }),
    { params: Promise.resolve({ id: ID }) },
  )

const updateReturning = (result: { data: unknown; error: { code?: string } | null }) => {
  const maybeSingle = vi.fn().mockResolvedValue(result)
  const update = vi.fn(() => ({ eq: () => ({ select: () => ({ maybeSingle }) }) }))
  return update
}

describe('PUT /api/admin/promotional-codes/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin' } })
  })

  it('rejects a body with neither a percentage nor an amount, before touching the database', async () => {
    const response = await put({ ...valid, discount_percent: null })
    expect(response.status).toBe(400)
    expect((await response.json()).error).toContain('pourcentage')
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('rejects a body that is not JSON', async () => {
    const response = await (PUT as unknown as (request: Request, context: { params: Promise<{ id: string }> }) => Promise<Response>)(
      new Request('http://localhost', { method: 'PUT', body: 'nope' }),
      { params: Promise.resolve({ id: ID }) },
    )
    expect(response.status).toBe(400)
  })

  it('answers 409 when the new code already exists', async () => {
    supabaseAdminMock.mockReturnValue({ from: () => ({ update: updateReturning({ data: null, error: { code: '23505' } }) }) })
    expect((await put(valid)).status).toBe(409)
  })

  it('answers 404 when the code does not exist', async () => {
    supabaseAdminMock.mockReturnValue({ from: () => ({ update: updateReturning({ data: null, error: null }) }) })
    expect((await put(valid)).status).toBe(404)
  })

  it('refuses a non-admin', async () => {
    requireAdminMock.mockResolvedValue({ ok: false, response: new Response(null, { status: 403 }) })
    expect((await put(valid)).status).toBe(403)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })
})
