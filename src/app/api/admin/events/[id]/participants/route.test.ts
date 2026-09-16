import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerMock, supabaseAdminMock } = vi.hoisted(() => ({
  createSupabaseServerMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: createSupabaseServerMock,
  supabaseAdmin: supabaseAdminMock,
}))

import { GET } from './route'

const EVENT_ID = '56e08f7d-24c3-44be-b123-4f034c669909'
const REGISTRATION_ID = '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'

function createAdminMock() {
  const registrations = [
    {
      id: REGISTRATION_ID,
      user_id: '3d0272d2-647c-4b7b-8c68-3c9a3ecb99d9',
      ticket_id: '4d0272d2-647c-4b7b-8c68-3c9a3ecb99d9',
      order_id: '5d0272d2-647c-4b7b-8c68-3c9a3ecb99d9',
      email: 'runner@example.com',
      checked_in: false,
      claim_status: 'claimed',
      approval_status: 'approved',
      created_at: '2026-09-15T08:00:00.000Z',
      start_time: '2026-09-20T10:00:00.000Z',
      wave_index: 2,
    },
  ]

  const registrationQuery: any = {
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: registrations, count: 1, error: null }),
  }

  const lookup = (data: unknown[]) => ({
    select: vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({ data, error: null }) }),
  })

  return {
    from: vi.fn((table: string) => {
      if (table === 'registrations') {
        return { select: vi.fn().mockReturnValue(registrationQuery) }
      }
      if (table === 'tickets') {
        return lookup([{ id: registrations[0].ticket_id, name: 'Open 20 km', race: { name: 'Open' } }])
      }
      if (table === 'profiles') {
        return lookup([{ id: registrations[0].user_id, full_name: 'Camille Martin' }])
      }
      if (table === 'group_members') {
        return lookup([{ profile_id: registrations[0].user_id, group: { id: 'g1', name: 'Les loups' } }])
      }
      if (table === 'orders') {
        return lookup([{ id: registrations[0].order_id, status: 'paid', amount_total: 4900, currency: 'eur' }])
      }
      throw new Error(`Unexpected table: ${table}`)
    }),
    registrationQuery,
  }
}

describe('GET /api/admin/events/[id]/participants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createSupabaseServerMock.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'admin-1' } } }) },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: { role: 'admin' } }) }) }),
      }),
    })
  })

  it('returns a small event-scoped read model for an administrator', async () => {
    const admin = createAdminMock()
    supabaseAdminMock.mockReturnValue(admin)

    const response = await GET(
      new Request(`http://localhost/api/admin/events/${EVENT_ID}/participants?limit=25`) as any,
      { params: Promise.resolve({ id: EVENT_ID }) },
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(admin.registrationQuery.eq).toHaveBeenCalledWith('event_id', EVENT_ID)
    expect(body).toMatchObject({
      participants: [
        {
          id: REGISTRATION_ID,
          participant: { name: 'Camille Martin', email: 'runner@example.com', accountStatus: 'claimed' },
          ticket: { name: 'Open 20 km', format: 'OPEN' },
          group: 'Les loups',
          payment: { status: 'paid', amountCents: 4900, currency: 'eur' },
        },
      ],
      page: { limit: 25, totalCount: 1, nextCursor: null },
    })
    expect(body.participants[0]).not.toHaveProperty('cursor')
  })

  it('rejects an invalid event id before authentication or data access', async () => {
    const response = await GET(
      new Request('http://localhost/api/admin/events/not-an-uuid/participants') as any,
      { params: Promise.resolve({ id: 'not-an-uuid' }) },
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Identifiant événement invalide' })
    expect(createSupabaseServerMock).not.toHaveBeenCalled()
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid cursor without querying the database', async () => {
    const response = await GET(
      new Request(`http://localhost/api/admin/events/${EVENT_ID}/participants?cursor=not-a-cursor`) as any,
      { params: Promise.resolve({ id: EVENT_ID }) },
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Cursor de pagination invalide' })
    expect(createSupabaseServerMock).not.toHaveBeenCalled()
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('rejects a non-administrator before querying registration data', async () => {
    createSupabaseServerMock.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'member-1' } } }) },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: { role: 'user' } }) }) }),
      }),
    })

    const response = await GET(
      new Request(`http://localhost/api/admin/events/${EVENT_ID}/participants`) as any,
      { params: Promise.resolve({ id: EVENT_ID }) },
    )

    expect(response.status).toBe(403)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })
})
