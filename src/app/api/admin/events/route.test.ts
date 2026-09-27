import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, requireAdminOrganizationMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  requireAdminOrganizationMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/auth/requireAdminOrganization', () => ({ requireAdminOrganization: requireAdminOrganizationMock }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({ withRequestLogging: (handler: unknown) => handler }))
vi.mock('@/lib/email/marketing', () => ({
  dispatchNewEventAnnouncement: vi.fn(),
  getMarketingOptInRecipients: vi.fn(),
}))

import { GET } from './route'

const EVENT_ID = '56e08f7d-24c3-44be-b123-4f034c669909'

function createAdminMock() {
  const events = [
    { id: EVENT_ID, title: 'Overbound Paris', slug: 'paris', location: 'Paris', date: '2026-10-01T10:00:00.000Z', created_at: '2026-09-01T10:00:00.000Z', status: 'on_sale', capacity: 500 },
    { id: '66e08f7d-24c3-44be-b123-4f034c669909', title: 'Overbound Lyon', slug: 'lyon', location: 'Lyon', date: '2026-11-01T10:00:00.000Z', created_at: '2026-09-02T10:00:00.000Z', status: 'draft', capacity: 300 },
  ]
  const eventQuery: any = {
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: events, count: events.length, error: null }),
  }
  const statsQuery = (count: number) => ({
    eq: vi.fn().mockResolvedValue({ count, error: null }),
  })
  const admin = {
    from: vi.fn((table: string) => {
      if (table === 'events') return { select: vi.fn().mockReturnValue(eventQuery) }
      if (table === 'registrations') return { select: vi.fn().mockReturnValue(statsQuery(3)) }
      if (table === 'volunteer_applications') return { select: vi.fn().mockReturnValue(statsQuery(2)) }
      throw new Error(`Unexpected table: ${table}`)
    }),
    eventQuery,
  }
  return admin
}

describe('GET /api/admin/events paginated listing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminOrganizationMock.mockResolvedValue({ ok: true, organizationId: 'org-1' })
  })

  it('returns a bounded page with event stats and pagination metadata', async () => {
    const admin = createAdminMock()
    supabaseAdminMock.mockReturnValue(admin)

    const response = await GET(new Request('http://localhost/api/admin/events?paginated=true&limit=25&sort=date&direction=asc') as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(admin.eventQuery.limit).toHaveBeenCalledWith(26)
    expect(body.events).toHaveLength(2)
    expect(body.events[0]).toMatchObject({ registrations_count: 3, volunteer_applications_count: 2 })
    expect(body.page).toMatchObject({ limit: 25, totalCount: 2, nextCursor: null })
  })

  it('rejects an invalid cursor before querying Supabase', async () => {
    const admin = createAdminMock()
    supabaseAdminMock.mockReturnValue(admin)

    const response = await GET(new Request('http://localhost/api/admin/events?paginated=true&cursor=not-a-cursor') as any)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Cursor de pagination invalide' })
    expect(admin.from).not.toHaveBeenCalled()
  })

  it('rejects invalid query parameters', async () => {
    const response = await GET(new Request('http://localhost/api/admin/events?paginated=true&limit=5') as any)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Paramètres de liste invalides' })
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })
})
