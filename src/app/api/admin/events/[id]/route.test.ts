import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, createSupabaseServerMock, requireAdminOrganizationMock, rpcMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  createSupabaseServerMock: vi.fn(),
  requireAdminOrganizationMock: vi.fn(),
  rpcMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: supabaseAdminMock,
  createSupabaseServer: createSupabaseServerMock,
}))
vi.mock('@/lib/logging/adminRequestLogger', () => ({ withRequestLogging: <T,>(handler: T) => handler }))
vi.mock('@/lib/auth/requireAdminOrganization', () => ({ requireAdminOrganization: requireAdminOrganizationMock }))
vi.mock('@/lib/email/marketing', () => ({ dispatchNewEventAnnouncement: vi.fn(), getMarketingOptInRecipients: vi.fn() }))
vi.mock('@/lib/email/eventUpdates', () => ({ notifyEventUpdate: vi.fn() }))
vi.mock('@/lib/email/eventOpenings', () => ({ notifyEventOpening: vi.fn() }))

import { DELETE, PUT } from './route'

const EVENT_ID = '0f0c2a7e-6b1d-4c1e-9a55-1d2f3e4a5b6c'
const ORG_ID = 'org-1'
const params = { params: Promise.resolve({ id: EVENT_ID }) }

function chain(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const builder: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'neq', 'is', 'not', 'order', 'single', 'limit', 'update', 'insert', 'delete', 'in']) {
    builder[method] = () => builder
  }
  builder.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve({ data: null, error: null, count: 0, ...result }).then(resolve, reject)
  return builder
}

const deleteRequest = (query = '') =>
  new Request(`http://localhost/api/admin/events/${EVENT_ID}${query}`, { method: 'DELETE' }) as never

const putRequest = (body: unknown) =>
  new Request(`http://localhost/api/admin/events/${EVENT_ID}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as never

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminOrganizationMock.mockResolvedValue({ ok: true, organizationId: ORG_ID, user: { id: 'admin-1' } })
  supabaseAdminMock.mockReturnValue({ rpc: rpcMock, from: vi.fn(() => chain({ data: null, error: null, count: 0 })) })
  createSupabaseServerMock.mockResolvedValue({ from: vi.fn(() => chain({ data: { id: EVENT_ID, status: 'draft' }, error: null })) })
})

describe('DELETE /api/admin/events/[id]', () => {
  it('deletes through the guarded RPC and returns its answer', async () => {
    rpcMock.mockResolvedValue({ data: { deleted: true, event_id: EVENT_ID }, error: null })

    const response = await DELETE(deleteRequest(), params)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ deleted: true, event_id: EVENT_ID })
    expect(rpcMock).toHaveBeenCalledWith('admin_delete_event_without_records', {
      p_event_id: EVENT_ID,
      p_organization_id: ORG_ID,
    })
  })

  it('refuses an event with records: 409, counts, and no delete', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: {
        message: 'EVENT_HAS_RECORDS',
        details: JSON.stringify({ registrationsCount: 3, volunteersCount: 0, luckyWheelEntriesCount: 0 }),
      },
    })

    const response = await DELETE(deleteRequest(), params)

    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ requiresCancellation: true, registrationsCount: 3 })
  })

  it('ignores the legacy force flag: it can no longer delete records', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'EVENT_HAS_RECORDS', details: JSON.stringify({ registrationsCount: 9, volunteersCount: 0, luckyWheelEntriesCount: 0 }) },
    })

    const response = await DELETE(deleteRequest('?force=true'), params)

    expect(response.status).toBe(409)
    expect(rpcMock).toHaveBeenCalledTimes(1)
    const calledTables = (supabaseAdminMock.mock.results[0]?.value as { from: ReturnType<typeof vi.fn> }).from.mock.calls
    expect(calledTables.map(([table]) => table)).not.toEqual(expect.arrayContaining(['registrations', 'tickets']))
  })

  it('returns the auth response untouched when the caller is not an admin of the organization', async () => {
    const unauthorized = new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 403 })
    requireAdminOrganizationMock.mockResolvedValue({ ok: false, response: unauthorized })

    const response = await DELETE(deleteRequest(), params)

    expect(response.status).toBe(403)
    expect(rpcMock).not.toHaveBeenCalled()
  })
})

describe('PUT /api/admin/events/[id]', () => {
  it('refuses a body without status before reading the event or writing anything', async () => {
    const response = await PUT(
      putRequest({ slug: 'ultra-arena', title: 'Ultra', date: '2027-04-24T10:00:00Z', location: 'SQY', capacity: 10 }),
      params,
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: expect.any(String) })
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('answers 409 when the slug is already used by another event (unique violation)', async () => {
    supabaseAdminMock.mockReturnValue({
      rpc: rpcMock,
      from: vi.fn(() => chain({ data: null, error: { code: '23505', message: 'duplicate key value' } })),
    })

    const response = await PUT(
      putRequest({ slug: 'ultra-arena', title: 'Ultra', date: '2027-04-24T10:00:00Z', location: 'SQY', capacity: 10, status: 'draft' }),
      params,
    )

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'Un événement avec ce slug existe déjà' })
  })

  it('keeps other database errors as server errors', async () => {
    supabaseAdminMock.mockReturnValue({
      rpc: rpcMock,
      from: vi.fn(() => chain({ data: null, error: { code: '08006', message: 'connection failure' } })),
    })

    const response = await PUT(
      putRequest({ slug: 'ultra-arena', title: 'Ultra', date: '2027-04-24T10:00:00Z', location: 'SQY', capacity: 10, status: 'draft' }),
      params,
    )

    expect(response.status).toBe(500)
  })
})
