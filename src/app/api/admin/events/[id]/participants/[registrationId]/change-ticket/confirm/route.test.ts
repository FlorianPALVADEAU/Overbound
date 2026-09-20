import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, requireAdminOrganizationMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  requireAdminOrganizationMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/auth/requireAdminOrganization', () => ({ requireAdminOrganization: requireAdminOrganizationMock }))

import { POST } from './route'

const EVENT_ID = '56e08f7d-24c3-44be-b123-4f034c669909'
const REG_ID = '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'
const BODY = {
  commandId: '4d0272d2-647c-4b7b-8c68-3c9a3ecb99d9',
  previewId: 'preview-1',
  previewSourceVersion: 'version-1',
  currentSourceVersion: 'version-1',
  policyVariant: 'NO_MOVEMENT',
  reason: 'Correction opérationnelle validée',
  previewExpiresAt: '2026-09-20T10:00:00.000Z',
  eventStartsAt: '2026-09-20T08:00:00.000Z',
  eventTimezone: 'Europe/Paris',
  targetTicketId: '4d0272d2-647c-4b7b-8c68-3c9a3ecb99d9',
  expectedTicketId: '56e08f7d-24c3-44be-b123-4f034c669909',
  expectedWaveIndex: 1,
  expectedStartTime: '2026-09-20T08:00:00.000Z',
}

describe('POST ticket change confirmation', () => {
  const rpc = vi.fn()
  const registrationUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminOrganizationMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' }, organizationId: 'org-1', role: 'admin' })
    rpc.mockResolvedValue({ data: { status: 'SUCCEEDED' }, error: null })
    const admin = {
      rpc,
      from(table: string) {
        if (table === 'events') {
          const query: any = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: { id: EVENT_ID }, error: null }) }
          return query
        }
        if (table === 'registrations') {
          const query: any = {
            select: () => query,
            update: (payload: unknown) => { registrationUpdate(payload); return query },
            eq: () => query,
            maybeSingle: async () => ({ data: { id: REG_ID, organization_id: null }, error: null }),
            then: (resolve: (value: unknown) => unknown) => resolve({ error: null }),
          }
          return query
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    }
    supabaseAdminMock.mockReturnValue(admin)
  })

  it('confirms a valid no-movement command through the server RPC', async () => {
    const response = await POST(
      new Request('http://localhost', { method: 'POST', body: JSON.stringify(BODY) }) as any,
      { params: Promise.resolve({ id: EVENT_ID, registrationId: REG_ID }) },
    )
    expect(response.status).toBe(200)
    expect(registrationUpdate).toHaveBeenCalledWith({ organization_id: 'org-1' })
    expect(rpc).toHaveBeenCalledOnce()
  })

  it('rejects malformed commands before authentication', async () => {
    const response = await POST(
      new Request('http://localhost', { method: 'POST', body: JSON.stringify({ ...BODY, reason: '' }) }) as any,
      { params: Promise.resolve({ id: EVENT_ID, registrationId: REG_ID }) },
    )
    expect(response.status).toBe(400)
    expect(requireAdminOrganizationMock).not.toHaveBeenCalled()
  })
})
