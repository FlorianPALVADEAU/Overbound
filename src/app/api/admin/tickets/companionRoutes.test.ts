import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, requireAdminOrganizationMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  requireAdminOrganizationMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/auth/requireAdminOrganization', () => ({ requireAdminOrganization: requireAdminOrganizationMock }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({ withRequestLogging: (handler: unknown) => handler }))

import { POST } from './route'
import { PUT, DELETE } from './[id]/route'

const ORGANIZATION_ID = 'org-1'
const EVENT_ID = 'event-1'
const OPEN_ID = 'open-ticket'
const RANKED_ID = 'ranked-ticket'

const companion = { ticket_id: OPEN_ID, price_cents: 2900, ranked_max_duration_minutes: 230, min_gap_minutes: 20 }
const rankedConfig = { departure_mode: 'fixed', departure_change_policy: 'preserve', open_companion: companion }

const eventTickets = [
  { id: OPEN_ID, event_id: EVENT_ID, name: 'OPEN', operations_config: { departure_mode: 'wave', departure_change_policy: 'preserve' }, race: null },
]

/** Admin client double: each table call returns a chainable query resolving to the given rows. */
const createAdmin = ({ tickets = eventTickets, owners = [] as { name: string }[] } = {}) => {
  const written: Record<string, unknown>[] = []
  const chain = (result: unknown) => {
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      insert: vi.fn((row: Record<string, unknown>) => { written.push(row); return query }),
      update: vi.fn((row: Record<string, unknown>) => { written.push(row); return query }),
      delete: vi.fn(() => query),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: EVENT_ID }, error: null }),
      single: vi.fn().mockResolvedValue({ data: { id: RANKED_ID }, error: null }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
    }
    return query
  }
  const from = vi.fn((table: string) => {
    if (table === 'events') return chain({ data: { id: EVENT_ID }, error: null })
    return {
      select: vi.fn((columns: string) => {
        const isGuardLookup = columns.includes('operations_config')
        const isOwnerLookup = columns === 'name'
        if (isGuardLookup) return chain({ data: tickets, error: null })
        if (isOwnerLookup) return chain({ data: owners, error: null })
        return chain({ count: 0, data: [], error: null })
      }),
      insert: vi.fn((row: Record<string, unknown>) => { written.push(row); return chain({ data: null, error: null }) }),
      update: vi.fn((row: Record<string, unknown>) => { written.push(row); return chain({ data: null, error: null }) }),
      delete: vi.fn(() => chain({ error: null })),
    }
  })
  return { from, written }
}

const post = (body: unknown) => POST(new Request('http://localhost/api/admin/tickets', { method: 'POST', body: JSON.stringify(body) }) as any)
const put = (body: unknown) =>
  (PUT as any)(new Request('http://localhost/api/admin/tickets/x', { method: 'PUT', body: JSON.stringify(body) }), { params: Promise.resolve({ id: RANKED_ID }) })
const del = (id: string) =>
  (DELETE as any)(new Request(`http://localhost/api/admin/tickets/${id}`, { method: 'DELETE' }), { params: Promise.resolve({ id }) })

const baseBody = { event_id: EVENT_ID, name: 'RANKED', price: 7000, max_participants: 100 }

describe('admin tickets: Option OPEN', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminOrganizationMock.mockResolvedValue({ ok: true, organizationId: ORGANIZATION_ID, user: { id: 'admin-1' }, role: 'admin' })
  })

  it('refuses to create a ticket whose option points at a missing OPEN ticket', async () => {
    supabaseAdminMock.mockReturnValue(createAdmin({ tickets: [] }))
    const response = await post({ ...baseBody, operations_config: rankedConfig })
    expect(response.status).toBe(400)
    expect((await response.json()).error).toMatch(/même événement/)
  })

  it('refuses to update a ticket with an incomplete option', async () => {
    supabaseAdminMock.mockReturnValue(createAdmin())
    const response = await put({
      ...baseBody,
      operations_config: { departure_mode: 'fixed', departure_change_policy: 'preserve', open_companion: { ticket_id: OPEN_ID } },
    })
    expect(response.status).toBe(400)
  })

  it('saves a valid option untouched', async () => {
    const admin = createAdmin()
    supabaseAdminMock.mockReturnValue(admin)
    const response = await put({ ...baseBody, operations_config: rankedConfig })
    expect(response.status).toBe(200)
    expect(admin.written[0]).toMatchObject({ operations_config: { open_companion: companion } })
  })

  it('does not validate tickets that carry no option', async () => {
    supabaseAdminMock.mockReturnValue(createAdmin({ tickets: [] }))
    const response = await put({ ...baseBody, operations_config: { departure_mode: 'none', departure_change_policy: 'preserve' } })
    expect(response.status).toBe(200)
  })

  it('refuses to delete the OPEN ticket an option is issued on', async () => {
    supabaseAdminMock.mockReturnValue(createAdmin({ owners: [{ name: 'RANKED 2027' }] }))
    const response = await del(OPEN_ID)
    expect(response.status).toBe(409)
    expect((await response.json()).error).toContain('RANKED 2027')
  })

  it('deletes a ticket no option points at', async () => {
    supabaseAdminMock.mockReturnValue(createAdmin())
    const response = await del('free-ticket')
    expect(response.status).toBe(200)
  })
})
