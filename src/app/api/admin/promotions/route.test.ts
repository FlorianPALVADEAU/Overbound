import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerMock, supabaseAdminMock, requireAdminMock } = vi.hoisted(() => ({
  createSupabaseServerMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  requireAdminMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: createSupabaseServerMock,
  supabaseAdmin: supabaseAdminMock,
}))
vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({ withRequestLogging: (handler: unknown) => handler }))

import { GET } from './route'

const PROMOTION_ID = '56e08f7d-24c3-44be-b123-4f034c669909'

function createPromotionMock() {
  const promotions = [
    {
      id: PROMOTION_ID,
      type: 'banner',
      title: 'Ouverture des inscriptions',
      description: 'Les inscriptions sont ouvertes.',
      link_url: '/register',
      link_text: 'Je m’inscris',
      starts_at: '2026-09-01T10:00:00.000Z',
      ends_at: '2026-10-01T10:00:00.000Z',
      is_active: true,
      created_at: '2026-08-01T10:00:00.000Z',
    },
  ]
  const query: any = {
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: promotions, count: promotions.length, error: null }),
  }
  const client = {
    from: vi.fn(() => ({ select: vi.fn(() => query) })),
    query,
  }
  return client
}

describe('GET /api/admin/promotions paginated listing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminMock.mockResolvedValue({ ok: true })
  })

  it('returns a bounded page with pagination metadata', async () => {
    const client = createPromotionMock()
    createSupabaseServerMock.mockResolvedValue(client)

    const response = await GET(new Request('http://localhost/api/admin/promotions?paginated=true&limit=25') as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(client.query.limit).toHaveBeenCalledWith(26)
    expect(body.promotions).toHaveLength(1)
    expect(body.page).toMatchObject({ limit: 25, totalCount: 1, nextCursor: null })
  })

  it('rejects an invalid cursor before querying Supabase', async () => {
    const client = createPromotionMock()
    createSupabaseServerMock.mockResolvedValue(client)

    const response = await GET(new Request('http://localhost/api/admin/promotions?paginated=true&cursor=not-a-cursor') as any)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Cursor de pagination invalide' })
    expect(client.from).not.toHaveBeenCalled()
  })

  it('rejects invalid query parameters', async () => {
    const response = await GET(new Request('http://localhost/api/admin/promotions?paginated=true&limit=5') as any)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Paramètres de liste invalides' })
    expect(createSupabaseServerMock).not.toHaveBeenCalled()
  })
})
