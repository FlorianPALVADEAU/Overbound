import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerMock, supabaseAdminMock } = vi.hoisted(() => ({
  createSupabaseServerMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: createSupabaseServerMock,
  supabaseAdmin: supabaseAdminMock,
}))

import { POST } from './route'

const EVENT_ID = '56e08f7d-24c3-44be-b123-4f034c669909'
const REG_ID = '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'
const TICKET_ID = '4d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'

function builder(result: { data: unknown; error: unknown }) {
  const query: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  }
  return query
}

function adminMock(options: {
  event?: unknown
  registration?: unknown
  ticket?: unknown
  wave?: unknown
  group?: unknown
} = {}) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'events') return builder({ data: options.event ?? { date: '2026-09-20T08:00:00Z' }, error: null })
      if (table === 'registrations') return builder({ data: options.registration ?? { id: REG_ID, event_id: EVENT_ID, ticket_id: TICKET_ID, user_id: null, wave_index: 2, start_time: '2026-09-20T12:10:00Z' }, error: null })
      if (table === 'tickets') return builder({ data: options.ticket ?? { id: TICKET_ID, event_id: EVENT_ID, name: 'Trail OPEN', race: { name: 'Trail' } }, error: null })
      if (table === 'event_waves') return builder({ data: options.wave ?? { wave_index: 4, start_time: '2026-09-20T12:30:00Z', capacity: 50, assigned_count: 12, is_closed: false }, error: null })
      if (table === 'group_members') return builder({ data: options.group === undefined ? null : { group: options.group }, error: null })
      throw new Error(`Unexpected table: ${table}`)
    }),
  }
}

describe('POST wave change preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createSupabaseServerMock.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'admin-1' } } }) },
      from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { role: 'admin' } }) }) }) }),
    })
  })

  it('returns an allowed read-only preview for an OPEN registration', async () => {
    const admin = adminMock()
    supabaseAdminMock.mockReturnValue(admin)

    const response = await POST(
      new Request('http://localhost', { method: 'POST', body: JSON.stringify({ waveIndex: 4 }) }) as any,
      { params: Promise.resolve({ id: EVENT_ID, registrationId: REG_ID }) },
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.preview).toMatchObject({
      allowed: true,
      registration: { format: 'OPEN', currentWaveIndex: 2 },
      target: { waveIndex: 4, remainingCapacity: 38 },
      impacts: { departure: 'changed', group: 'none', waveCounters: 'would_refresh' },
    })
    expect(admin.from).not.toHaveBeenCalledWith('registrations', expect.objectContaining({ update: expect.anything() }))
  })

  it('blocks a closed or full target SAS', async () => {
    supabaseAdminMock.mockReturnValue(adminMock({ wave: { wave_index: 4, start_time: '2026-09-20T12:30:00Z', capacity: 50, assigned_count: 50, is_closed: true } }))

    const response = await POST(
      new Request('http://localhost', { method: 'POST', body: JSON.stringify({ waveIndex: 4 }) }) as any,
      { params: Promise.resolve({ id: EVENT_ID, registrationId: REG_ID }) },
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.preview.allowed).toBe(false)
    expect(body.preview.blockers).toEqual(expect.arrayContaining(['La SAS cible est fermée.', 'La SAS cible est pleine.']))
  })

  it('blocks a target that conflicts with the group anchor', async () => {
    supabaseAdminMock.mockReturnValue(adminMock({
      registration: { id: REG_ID, event_id: EVENT_ID, ticket_id: TICKET_ID, user_id: 'profile-1', wave_index: 2, start_time: '2026-09-20T12:10:00Z' },
      group: { name: 'Team Acme', anchor_event_id: EVENT_ID, anchor_wave_index: 3 },
    }))

    const response = await POST(
      new Request('http://localhost', { method: 'POST', body: JSON.stringify({ waveIndex: 4 }) }) as any,
      { params: Promise.resolve({ id: EVENT_ID, registrationId: REG_ID }) },
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.preview.allowed).toBe(false)
    expect(body.preview.impacts.group).toBe('blocked_by_anchor')
    expect(body.preview.blockers[0]).toContain('impose la SAS 3')
  })

  it('rejects malformed input before authentication or database access', async () => {
    const response = await POST(
      new Request('http://localhost', { method: 'POST', body: JSON.stringify({ waveIndex: 25 }) }) as any,
      { params: Promise.resolve({ id: EVENT_ID, registrationId: REG_ID }) },
    )

    expect(response.status).toBe(400)
    expect(createSupabaseServerMock).not.toHaveBeenCalled()
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('rejects RANKED registrations', async () => {
    supabaseAdminMock.mockReturnValue(adminMock({ ticket: { id: TICKET_ID, event_id: EVENT_ID, name: 'Trail RANKED', race: { name: 'Trail' } } }))

    const response = await POST(
      new Request('http://localhost', { method: 'POST', body: JSON.stringify({ waveIndex: 4 }) }) as any,
      { params: Promise.resolve({ id: EVENT_ID, registrationId: REG_ID }) },
    )

    expect(response.status).toBe(422)
    expect((await response.json()).error).toContain('OPEN')
  })

  it('blocks a preview from J-1 on the server', async () => {
    const admin = adminMock({ event: { date: '2026-09-17T08:00:00Z' } })
    supabaseAdminMock.mockReturnValue(admin)
    const response = await POST(
      new Request('http://localhost', { method: 'POST', body: JSON.stringify({ waveIndex: 4 }) }) as any,
      { params: Promise.resolve({ id: EVENT_ID, registrationId: REG_ID }) },
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.preview.allowed).toBe(false)
    expect(body.preview.blockers).toContain('Les corrections sont interdites à partir de J-1 inclus avant le début de l’événement.')
  })
})
