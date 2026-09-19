import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerMock, supabaseAdminMock, requireAdminOrganizationMock } = vi.hoisted(() => ({ createSupabaseServerMock: vi.fn(), supabaseAdminMock: vi.fn(), requireAdminOrganizationMock: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createSupabaseServer: createSupabaseServerMock, supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/auth/requireAdminOrganization', () => ({ requireAdminOrganization: requireAdminOrganizationMock }))

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
  const event = query({ date: '2026-09-20T08:00:00Z' })
  const registrations = query({ id: REG_ID, event_id: EVENT_ID, ticket_id: CURRENT_ID, user_id: null, wave_index: 2, start_time: '2026-09-20T12:10:00Z' })
  const tickets = query([
    { id: CURRENT_ID, event_id: EVENT_ID, name: 'Trail OPEN', final_price_cents: 5000, currency: 'eur', race: { name: 'Trail' } },
    { id: TARGET_ID, event_id: EVENT_ID, name: 'Trail RANKED', final_price_cents: 5000, currency: 'eur', race: { name: 'Trail' } },
  ])
  return { from: vi.fn((table: string) => table === 'events' ? event : table === 'registrations' ? registrations : table === 'tickets' ? tickets : query(null)) }
}

describe('POST ticket change preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminOrganizationMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' }, organizationId: 'org-1', role: 'owner' })
    vi.setSystemTime(new Date('2026-09-18T10:00:00.000Z'))
    createSupabaseServerMock.mockResolvedValue({ auth: { getUser: async () => ({ data: { user: { id: 'admin-1' } } }) }, from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { role: 'admin' } }) }) }) }) })
  })

  afterEach(() => {
    vi.useRealTimers()
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

  it('blocks a preview from J-1 on the server', async () => {
    const admin = adminMock()
    ;(admin.from('events').maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { date: '2026-09-17T08:00:00Z' }, error: null })
    supabaseAdminMock.mockReturnValue(admin)
    const response = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ ticketId: TARGET_ID }) }) as any, { params: Promise.resolve({ id: EVENT_ID, registrationId: REG_ID }) })
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.preview.allowed).toBe(false)
    expect(body.preview.blockers).toContain('Les corrections sont interdites à partir de J-1 inclus avant le début de l’événement.')
  })
})
