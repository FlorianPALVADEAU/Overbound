import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, createSupabaseServerMock, requireAdminMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  createSupabaseServerMock: vi.fn(),
  requireAdminMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock, createSupabaseServer: createSupabaseServerMock }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({ withRequestLogging: <T,>(handler: T) => handler }))
vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))

import { DELETE } from './route'

const RACE_ID = '7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d'
const params = { params: Promise.resolve({ id: RACE_ID }) }

function countChain(count: number) {
  const builder: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'in', 'delete']) builder[method] = () => builder
  builder.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve({ data: null, error: null, count }).then(resolve, reject)
  return builder
}

/** Admin client where each table answers with its own count, and every delete is recorded. */
function adminWithCounts(counts: Record<string, number>) {
  const deletedTables: string[] = []
  const from = vi.fn((table: string) => {
    const chainBuilder = countChain(counts[table] ?? 0)
    const originalDelete = chainBuilder.delete as () => unknown
    chainBuilder.delete = () => {
      deletedTables.push(table)
      return originalDelete()
    }
    return chainBuilder
  })
  return { admin: { from }, deletedTables }
}

const deleteRequest = (query = '') => new Request(`http://localhost/api/admin/races/${RACE_ID}${query}`, { method: 'DELETE' }) as never

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
  createSupabaseServerMock.mockResolvedValue({ from: () => countChain(0) })
})

describe('DELETE /api/admin/races/[id]', () => {
  it('deletes a race nothing uses, with its obstacle links', async () => {
    const { admin, deletedTables } = adminWithCounts({ tickets: 0, event_races: 0, registrations: 0 })
    supabaseAdminMock.mockReturnValue(admin)

    const response = await DELETE(deleteRequest(), params)

    expect(response.status).toBe(200)
    expect(deletedTables).toEqual(['race_obstacles', 'races'])
  })

  it('refuses a race that still has registrations: 409 and nothing deleted', async () => {
    const { admin, deletedTables } = adminWithCounts({ tickets: 0, event_races: 0, registrations: 12 })
    supabaseAdminMock.mockReturnValue(admin)

    const response = await DELETE(deleteRequest(), params)

    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ requiresDetach: true, registrationsCount: 12 })
    expect(deletedTables).toEqual([])
  })

  it('refuses a race still used by tickets even with the legacy force flag, and never deletes their registrations', async () => {
    const { admin, deletedTables } = adminWithCounts({ tickets: 2, event_races: 1, registrations: 40 })
    supabaseAdminMock.mockReturnValue(admin)

    const response = await DELETE(deleteRequest('?force=true'), params)

    expect(response.status).toBe(409)
    expect(deletedTables).toEqual([])
  })
})
