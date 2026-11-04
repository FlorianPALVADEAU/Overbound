import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, requireAdminOrganizationMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  requireAdminOrganizationMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/auth/requireAdminOrganization', () => ({ requireAdminOrganization: requireAdminOrganizationMock }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({ withRequestLogging: (handler: unknown) => handler }))
vi.mock('@/lib/ambassadors/email', () => ({
  sendAmbassadorWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  sendAmbassadorCodeAssignedEmail: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/email/resendAudiences', () => ({ deleteResendContactByEmail: vi.fn().mockResolvedValue(undefined) }))

import { PATCH } from './route'

const ADMIN_ID = '11111111-1111-4111-8111-111111111111'
const USER_ID = '56e08f7d-24c3-44be-b123-4f034c669909'
const CODE_ID = '5939b95c-9685-40d1-9dab-c0423e89adc3'

interface TableConfig {
  maybe?: { data: unknown; error?: unknown }
  single?: { data: unknown; error?: unknown }
  write?: { data?: unknown; error?: unknown }
}

/** A chainable stand-in for one table: terminal calls answer from the config, writes are recorded. */
function setup(tables: Record<string, TableConfig>) {
  const calls: Array<[string, unknown[]]> = []
  const builder = (table: string) => {
    const config = tables[table] ?? {}
    const self: any = {}
    for (const name of ['select', 'eq', 'in', 'update', 'upsert', 'insert', 'delete']) {
      self[name] = vi.fn((...args: unknown[]) => {
        calls.push([`${table}.${name}`, args])
        return self
      })
    }
    self.maybeSingle = vi.fn(async () => config.maybe ?? { data: null, error: null })
    self.single = vi.fn(async () => config.single ?? { data: null, error: null })
    self.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(config.write ?? { data: null, error: null }).then(resolve, reject)
    return self
  }
  const admin = {
    from: vi.fn((table: string) => builder(table)),
    auth: { admin: { getUserById: vi.fn().mockResolvedValue({ data: { user: { email: 'user@example.com' } }, error: null }) } },
  }
  return { admin, calls }
}

const patch = (id: string, body: unknown) =>
  PATCH(
    new Request(`http://localhost/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }) as any,
    { params: Promise.resolve({ id }) },
  )

describe('PATCH /api/admin/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminOrganizationMock.mockResolvedValue({ ok: true, organizationId: 'org-1', user: { id: ADMIN_ID } })
  })

  it('updates a listed account with no registration, group or membership (it used to answer 404)', async () => {
    const { admin } = setup({
      profiles: {
        maybe: { data: { id: USER_ID, role: 'user' } },
        single: { data: { id: USER_ID, full_name: 'Nouveau', role: 'admin', phone: null, created_at: '2026-01-01', date_of_birth: null, marketing_opt_in: null } },
      },
    })
    supabaseAdminMock.mockReturnValue(admin)

    const response = await patch(USER_ID, { role: 'admin' })

    expect(response.status).toBe(200)
    expect((await response.json()).profile).toMatchObject({ role: 'admin' })
  })

  it('answers 404 only when the profile does not exist', async () => {
    const { admin } = setup({ profiles: { maybe: { data: null } } })
    supabaseAdminMock.mockReturnValue(admin)

    const response = await patch(USER_ID, { role: 'admin' })

    expect(response.status).toBe(404)
  })

  it('reactivates the ambassador row when a former ambassador is set back to ambassador with the same code', async () => {
    const { admin, calls } = setup({
      profiles: {
        maybe: { data: { id: USER_ID, role: 'user' } },
        single: { data: { id: USER_ID, full_name: 'Ex', role: 'ambassador', phone: null, created_at: '2026-01-01', date_of_birth: null, marketing_opt_in: null } },
      },
      ambassadors: { maybe: { data: { promotional_code_id: CODE_ID } } },
    })
    supabaseAdminMock.mockReturnValue(admin)

    const response = await patch(USER_ID, { role: 'ambassador' })

    expect(response.status).toBe(200)
    expect(calls).toContainEqual(['ambassadors.update', [expect.objectContaining({ is_active: true })]])
  })

  it('refuses ambassador without any promo code when the account never had one', async () => {
    const { admin } = setup({
      profiles: { maybe: { data: { id: USER_ID, role: 'user' } } },
      ambassadors: { maybe: { data: null } },
    })
    supabaseAdminMock.mockReturnValue(admin)

    const response = await patch(USER_ID, { role: 'ambassador' })

    expect(response.status).toBe(400)
    expect((await response.json()).error).toBe('Un ambassadeur doit avoir un code promo actif.')
  })
})
