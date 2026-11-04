import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireAdminMock, supabaseAdminMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))
vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/groups/resolveGroupAnchor', () => ({ resolveGroupAnchorFromProfile: vi.fn(async () => null) }))
vi.mock('@/lib/groups/syncOpenGroupWave', () => ({
  syncOpenRegistrationsToWave: vi.fn(async () => ({ moved: 0, waveRegistrations: 0 })),
}))

import { POST } from './route'
import { syncOpenRegistrationsToWave as syncOpenRegistrationsToWaveMock } from '@/lib/groups/syncOpenGroupWave'

const GROUP_ID = '2b3c4d5e-6f70-4812-9a3b-4c5d6e7f8091'
const EVENT_ID = '9d8e7f60-1a2b-4c3d-8e4f-5a6b7c8d9e0f'
const params = { params: Promise.resolve({ id: GROUP_ID }) }

const request = (body: string) =>
  new Request(`http://localhost/api/admin/groups/${GROUP_ID}/members`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
  supabaseAdminMock.mockReturnValue({ from: vi.fn() })
})

describe('POST /api/admin/groups/[id]/members', () => {
  it('answers 400 and adds no member when the body is not JSON', async () => {
    const response = await POST(request('{pas du json') as never, params)

    expect(response.status).toBe(400)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('answers 400 when the profile id is not a uuid', async () => {
    const response = await POST(request(JSON.stringify({ profile_id: 'abc' })) as never, params)

    expect(response.status).toBe(400)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })
})

describe('POST /api/admin/groups/[id]/members retry', () => {
  /** Chainable builder: every filter returns the same chain, terminal calls resolve to the given result. */
  const chain = (result: { data: unknown; error: unknown }) => {
    const self: Record<string, unknown> = {}
    for (const method of ['select', 'eq', 'in', 'not', 'insert', 'update']) self[method] = vi.fn(() => self)
    self.maybeSingle = vi.fn(async () => result)
    self.then = (resolve: (value: unknown) => unknown) => resolve(result)
    return self
  }

  it('resumes the wave sync when the member already sits in this group (previous attempt failed mid-way)', async () => {
    const insertSpy = vi.fn()
    const tables: Record<string, () => Record<string, unknown>> = {
      groups: () => chain({ data: { id: GROUP_ID, anchor_event_id: EVENT_ID, anchor_wave_index: 3, anchor_start_time: '2026-09-12T10:20:00Z' }, error: null }),
      group_members: () => ({ ...chain({ data: { group_id: GROUP_ID }, error: null }), insert: insertSpy }),
      profiles: () => chain({ data: { id: '7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d' }, error: null }),
      registrations: () => chain({ data: [], error: null }),
    }
    supabaseAdminMock.mockReturnValue({ from: vi.fn((table: string) => tables[table]!()) })

    const response = await POST(request(JSON.stringify({ profile_id: '7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d' })) as never, params)

    expect(response.status).toBe(201)
    expect(insertSpy).not.toHaveBeenCalled()
    expect(syncOpenRegistrationsToWaveMock).toHaveBeenCalled()
  })
})
