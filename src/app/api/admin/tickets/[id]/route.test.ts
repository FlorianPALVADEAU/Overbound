import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, requireAdminOrganizationMock, findOwnersMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  requireAdminOrganizationMock: vi.fn(),
  findOwnersMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({ withRequestLogging: <T,>(handler: T) => handler }))
vi.mock('@/lib/auth/requireAdminOrganization', () => ({ requireAdminOrganization: requireAdminOrganizationMock }))
vi.mock('../companionGuard', () => ({
  checkTicketCompanion: vi.fn(),
  findTicketsUsingAsCompanion: findOwnersMock,
}))

import { DELETE } from './route'

const TICKET_ID = '9b8c7d6e-5f4a-4b3c-8d2e-1f0a9b8c7d6e'
const params = { params: Promise.resolve({ id: TICKET_ID }) }

/** Admin client: the registrations count is `registrations`, every delete is recorded in order. */
function adminClient(registrations: number) {
  const deleted: string[] = []
  const from = vi.fn((table: string) => {
    const builder: Record<string, unknown> = {}
    for (const method of ['select', 'eq']) builder[method] = () => builder
    builder.delete = () => {
      deleted.push(table)
      return builder
    }
    builder.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve({ data: null, error: null, count: table === 'registrations' ? registrations : 0 }).then(resolve, reject)
    return builder
  })
  return { client: { from }, deleted }
}

const deleteRequest = (query = '') => new Request(`http://localhost/api/admin/tickets/${TICKET_ID}${query}`, { method: 'DELETE' }) as never

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminOrganizationMock.mockResolvedValue({ ok: true, organizationId: 'org-1', user: { id: 'admin-1' } })
  findOwnersMock.mockResolvedValue([])
})

describe('DELETE /api/admin/tickets/[id]', () => {
  it('deletes a ticket without registrations', async () => {
    const { client, deleted } = adminClient(0)
    supabaseAdminMock.mockReturnValue(client)

    const response = await DELETE(deleteRequest(), params)

    expect(response.status).toBe(200)
    expect(deleted).toEqual(['tickets'])
  })

  it('refuses a ticket with registrations: 409 and no delete, paid registrations stay', async () => {
    const { client, deleted } = adminClient(4)
    supabaseAdminMock.mockReturnValue(client)

    const response = await DELETE(deleteRequest(), params)

    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ requiresDetach: true, registrationCount: 4 })
    expect(deleted).toEqual([])
  })

  it('ignores the legacy force flag', async () => {
    const { client, deleted } = adminClient(4)
    supabaseAdminMock.mockReturnValue(client)

    const response = await DELETE(deleteRequest('?force=true'), params)

    expect(response.status).toBe(409)
    expect(deleted).not.toContain('registrations')
    expect(deleted).not.toContain('tickets')
  })

  it('keeps the companion guard: a companion OPEN ticket is not deleted', async () => {
    findOwnersMock.mockResolvedValue(['RANKED - E2E'])
    const { client, deleted } = adminClient(0)
    supabaseAdminMock.mockReturnValue(client)

    const response = await DELETE(deleteRequest(), params)

    expect(response.status).toBe(409)
    expect(deleted).toEqual([])
  })
})
