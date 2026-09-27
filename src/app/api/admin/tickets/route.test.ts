import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, requireAdminOrganizationMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  requireAdminOrganizationMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/auth/requireAdminOrganization', () => ({ requireAdminOrganization: requireAdminOrganizationMock }))

import { GET } from './route'

const ORGANIZATION_ID = '56e08f7d-24c3-44be-b123-4f034c669909'
const TICKET_ID = '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'

function createAdminMock() {
  const rows = [{
    id: TICKET_ID,
    organization_id: ORGANIZATION_ID,
    event_id: '3d0272d2-647c-4b7b-8c68-3c9a3ecb99d9',
    name: 'Billet découverte',
    final_price_cents: 4900,
    created_at: '2026-09-15T08:00:00.000Z',
    event: { id: '3d0272d2-647c-4b7b-8c68-3c9a3ecb99d9', title: 'Overbound Paris', date: '2026-09-20T10:00:00.000Z', status: 'on_sale' },
    race: null,
  }]
  const query: any = {
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: rows, count: 1, error: null }),
  }
  return {
    from: vi.fn(() => ({ select: vi.fn().mockReturnValue(query) })),
    query,
  }
}

describe('GET /api/admin/tickets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminOrganizationMock.mockResolvedValue({ ok: true, organizationId: ORGANIZATION_ID, user: { id: 'admin-1' }, role: 'admin' })
  })

  it('returns a cursor page while preserving the tickets array', async () => {
    const admin = createAdminMock()
    supabaseAdminMock.mockReturnValue(admin)

    const response = await GET(new Request('http://localhost/api/admin/tickets?paginated=true&limit=25&query=discovery&sort=name&direction=asc') as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(admin.query.eq).toHaveBeenCalledWith('organization_id', ORGANIZATION_ID)
    expect(admin.query.limit).toHaveBeenCalledWith(26)
    expect(body.tickets).toHaveLength(1)
    expect(body.page).toEqual({ limit: 25, totalCount: 1, nextCursor: null })
  })

  it('rejects invalid pagination parameters before authentication or data access', async () => {
    const response = await GET(new Request('http://localhost/api/admin/tickets?paginated=true&limit=10') as any)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Paramètres de liste invalides' })
    expect(requireAdminOrganizationMock).not.toHaveBeenCalled()
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid cursor before querying ticket data', async () => {
    const response = await GET(new Request('http://localhost/api/admin/tickets?paginated=true&cursor=not-a-cursor') as any)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Cursor de pagination invalide' })
    expect(requireAdminOrganizationMock).toHaveBeenCalled()
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })
})
