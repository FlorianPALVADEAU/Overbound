import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerMock, supabaseAdminMock } = vi.hoisted(() => ({ createSupabaseServerMock: vi.fn(), supabaseAdminMock: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createSupabaseServer: createSupabaseServerMock, supabaseAdmin: supabaseAdminMock }))

import { POST } from './route'

const EVENT_ID = '56e08f7d-24c3-44be-b123-4f034c669909'
const REG_ID = '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'
const CURRENT_ID = '4d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'
const TARGET_ID = '5d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'

function query(data: unknown) {
  const builder: any = { eq: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ data, error: null }), maybeSingle: vi.fn().mockResolvedValue({ data, error: null }) }
  builder.select = vi.fn().mockReturnValue(builder)
  return builder
}

function adminMock() {
  const registrations = query({ id: REG_ID, event_id: EVENT_ID, ticket_id: CURRENT_ID, user_id: null, wave_index: 2, start_time: '2026-09-20T12:10:00Z' })
  const tickets = query([
    { id: CURRENT_ID, event_id: EVENT_ID, name: 'Trail OPEN', final_price_cents: 5000, currency: 'eur', race: { name: 'Trail' } },
    { id: TARGET_ID, event_id: EVENT_ID, name: 'Trail RANKED', final_price_cents: 5000, currency: 'eur', race: { name: 'Trail' } },
  ])
  return { from: vi.fn((table: string) => table === 'registrations' ? registrations : table === 'tickets' ? tickets : query(null)) }
}

describe('POST ticket change preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createSupabaseServerMock.mockResolvedValue({ auth: { getUser: async () => ({ data: { user: { id: 'admin-1' } } }) }, from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { role: 'admin' } }) }) }) }) })
  })

  it('returns a read-only preview for an administrator', async () => {
    const admin = adminMock()
    supabaseAdminMock.mockReturnValue(admin)
    const response = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ ticketId: TARGET_ID }) }) as any, { params: Promise.resolve({ id: EVENT_ID, registrationId: REG_ID }) })
    expect(response.status).toBe(200)
    expect((await response.json()).preview).toMatchObject({ allowed: true, current: { format: 'OPEN' }, target: { format: 'RANKED' } })
    expect(admin.from).not.toHaveBeenCalledWith('registrations', expect.objectContaining({ update: expect.anything() }))
  })

  it('rejects a malformed target before authentication or database access', async () => {
    const response = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ ticketId: 'nope' }) }) as any, { params: Promise.resolve({ id: EVENT_ID, registrationId: REG_ID }) })
    expect(response.status).toBe(400)
    expect(createSupabaseServerMock).not.toHaveBeenCalled()
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })
})
