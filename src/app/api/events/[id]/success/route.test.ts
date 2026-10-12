import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerMock, supabaseAdminMock } = vi.hoisted(() => ({
  createSupabaseServerMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: createSupabaseServerMock,
  supabaseAdmin: supabaseAdminMock,
}))
// Stripe is only reached with a payment_intent/session reference, never with registration_id.
vi.mock('stripe', () => ({ default: class {} }))

import { GET } from './route'

const REGISTRATION_ID = 'f6ff74bc-3193-458e-9c81-4d205eab71a3'

const REGISTRATION_ROW = {
  id: REGISTRATION_ID,
  user_id: 'user-1',
  order_id: 'o1',
  ticket: { id: 't1', name: 'OPEN - Ultra Arena', race: null },
  event: { id: 'e1', slug: 'caca', title: 'Caca', subtitle: null, date: '2026-09-12', location: 'SQY' },
  order: { id: 'o1', amount_total: 200, currency: 'eur' },
}

const mockUser = (id: string | null) =>
  createSupabaseServerMock.mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: id ? { id } : null } }) },
  })

// Records every select() so the test can assert which columns are requested.
// `siblings` are the registrations of the same order (group purchase).
const mockAdmin = (
  result: { data: unknown; error: { message: string } | null },
  siblings: unknown[] = [],
) => {
  const selects: string[] = []
  supabaseAdminMock.mockReturnValue({
    from: () => ({
      select: (columns: string) => {
        selects.push(columns)
        return {
          eq: () => ({
            maybeSingle: async () => result,
            eq: () => ({ order: async () => ({ data: siblings }) }),
          }),
        }
      },
    }),
  })
  return selects
}

const call = () =>
  GET(new Request(`http://localhost/api/events/caca/success?registration_id=${REGISTRATION_ID}`), {
    params: Promise.resolve({ id: 'caca' }),
  })

describe('GET /api/events/[id]/success', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test'
  })

  it('reads the registration without legacy columns', async () => {
    mockUser('user-1')
    const selects = mockAdmin({ data: REGISTRATION_ROW, error: null })

    const response = await call()

    expect(response.status).toBe(200)
    expect((await response.json()).registration.id).toBe(REGISTRATION_ID)
    // Regression: asking for base_price_cents / stripe_session_id failed the whole read
    // on databases without those columns and surfaced as "Inscription introuvable".
    expect(selects[0]).not.toMatch(/base_price_cents|stripe_session_id/)
  })

  it('returns every registration of a group order, not just the first', async () => {
    mockUser('user-1')
    const siblings = Array.from({ length: 8 }, (_, index) => ({ id: `r${index}`, email: `p${index}@example.com` }))
    mockAdmin({ data: REGISTRATION_ROW, error: null }, siblings)

    const body = await (await call()).json()

    expect(body.registrations).toHaveLength(8)
    expect(body.registration.id).toBe(REGISTRATION_ID)
  })

  it('answers 404 when the read fails', async () => {
    mockUser('user-1')
    mockAdmin({ data: null, error: { message: 'column does not exist' } })

    expect((await call()).status).toBe(404)
  })

  it('answers 403 for another user registration and 401 when signed out', async () => {
    mockUser('user-2')
    mockAdmin({ data: REGISTRATION_ROW, error: null })
    expect((await call()).status).toBe(403)

    mockUser(null)
    expect((await call()).status).toBe(401)
  })
})
