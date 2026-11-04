import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, requireAdminMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  requireAdminMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock, createSupabaseServer: vi.fn() }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({ withRequestLogging: <T,>(handler: T) => handler }))
vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))

import { POST } from './route'

const AMBASSADOR_ID = '1d2e3f40-5a6b-4c7d-8e9f-0a1b2c3d4e5f'
const CODE_ID = '9f8e7d6c-5b4a-4392-8170-6f5e4d3c2b1a'
const params = { params: Promise.resolve({ id: AMBASSADOR_ID }) }

const postRequest = (body: string) =>
  new Request(`http://localhost/api/admin/ambassadors/${AMBASSADOR_ID}/promo-codes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  }) as never

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
  supabaseAdminMock.mockReturnValue({ from: vi.fn() })
})

describe('POST /api/admin/ambassadors/[id]/promo-codes', () => {
  it('answers 400, not 500, when the body is not JSON', async () => {
    const response = await POST(postRequest('{pas du json'), params)

    expect(response.status).toBe(400)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('answers 400 when the promo code id is not a uuid', async () => {
    const response = await POST(postRequest(JSON.stringify({ promotional_code_id: 'abc' })), params)

    expect(response.status).toBe(400)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('answers 403 from the guard before reading the body', async () => {
    const guardResponse = new Response(null, { status: 403 })
    requireAdminMock.mockResolvedValue({ ok: false, response: guardResponse })

    const response = await POST(postRequest('{pas du json'), params)

    expect(response.status).toBe(403)
  })

  it('accepts a valid body and reaches the database', async () => {
    const upsertSelect = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: 'x', promotional_code_id: CODE_ID }, error: null }),
    })
    const chain: Record<string, unknown> = {}
    chain.upsert = vi.fn(() => ({ select: upsertSelect }))
    chain.update = vi.fn(() => chain)
    chain.eq = vi.fn(() => chain)
    supabaseAdminMock.mockReturnValue({ from: vi.fn(() => chain) })

    const response = await POST(postRequest(JSON.stringify({ promotional_code_id: CODE_ID })), params)

    expect(response.status).toBe(200)
    expect(chain.upsert).toHaveBeenCalled()
  })
})
