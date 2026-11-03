import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryRecorder, type QueryResult } from '@/lib/admin/queryRecorder'
import { encodeKeysetCursor } from '@/lib/admin/keysetCursor'

const mocks = vi.hoisted(() => ({ supabaseAdmin: vi.fn(), requireAdminOrganization: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: mocks.supabaseAdmin, createSupabaseServer: vi.fn() }))
vi.mock('@/lib/auth/requireAdminOrganization', () => ({ requireAdminOrganization: mocks.requireAdminOrganization }))

import { GET } from './route'

const ID = (n: number) => `3f2b8c1e-5d4a-4f6b-9a7c-${String(n).padStart(12, '0')}`
const EVENT = '7a1d2c3b-4e5f-4a6b-8c7d-9e0f1a2b3c4d'
const order = (n: number) => ({
  id: ID(n),
  email: `buyer${n}@example.com`,
  status: 'paid',
  amount_total: 4500,
  currency: 'eur',
  provider: 'stripe',
  provider_order_id: `pi_${n}`,
  invoice_url: null,
  created_at: `2026-11-03T10:${String(59 - n).padStart(2, '0')}:00.000Z`,
})

const call = async (search: string, results: QueryResult[]) => {
  const recorder = createQueryRecorder(results)
  mocks.supabaseAdmin.mockReturnValue(recorder.client)
  const response = await GET(new Request(`http://localhost/api/admin/orders${search}`) as never)
  return { response, body: await response.json(), recorder }
}

describe('GET /api/admin/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireAdminOrganization.mockResolvedValue({ ok: true, user: { id: 'admin' }, organizationId: 'org-1', role: 'admin' })
  })

  it('joins each order with its registrations and succeeded refunds', async () => {
    const { response, body } = await call('', [
      { data: [order(1)], count: 1 },
      { data: [{ id: 'reg-1', order_id: ID(1), cancelled_at: '2026-11-04T10:00:00.000Z', event: { title: 'Ultra Arena 2027' } }] },
      { data: [{ registration_id: 'reg-1', amount_cents: 4500 }] },
    ])

    expect(response.status).toBe(200)
    expect(body.orders).toHaveLength(1)
    expect(body.orders[0]).toMatchObject({
      email: 'buyer1@example.com',
      registrations: 1,
      cancelledRegistrations: 1,
      refundedCents: 4500,
      events: ['Ultra Arena 2027'],
      stripeUrl: expect.stringContaining('pi_1'),
    })
    expect(body.page).toMatchObject({ totalCount: 1, nextCursor: null })
  })

  it('returns a next cursor when more orders exist and keeps the page at the requested size', async () => {
    const rows = Array.from({ length: 26 }, (_, index) => order(index))
    const { body, recorder } = await call('?limit=25', [{ data: rows, count: 80 }, { data: [] }])

    expect(body.orders).toHaveLength(25)
    expect(body.page.nextCursor).toBe(encodeKeysetCursor({ createdAt: rows[24].created_at, id: rows[24].id }))
    expect(recorder.callOf(0, 'limit')).toEqual([26])
  })

  it('filters by status and search, and resumes after the cursor', async () => {
    const cursor = encodeKeysetCursor({ createdAt: '2026-11-03T10:00:00.000Z', id: ID(5) })
    const { response, recorder } = await call(`?status=pending&query=ada&cursor=${cursor}`, [{ data: [], count: 0 }])

    expect(response.status).toBe(200)
    expect(recorder.callOf(0, 'eq')).toEqual(['status', 'pending'])
    expect(String(recorder.callsOf(0, 'or')[0][0])).toContain('email.ilike.%ada%')
    expect(String(recorder.callsOf(0, 'or')[1][0])).toContain(`id.lt.${ID(5)}`)
  })

  it('scopes to an event owned by the organization', async () => {
    const { response, recorder } = await call(`?event=${EVENT}`, [{ data: { id: EVENT } }, { data: [], count: 0 }])
    expect(response.status).toBe(200)
    expect(recorder.callsOf(0, 'eq')).toEqual([['id', EVENT], ['organization_id', 'org-1']])
    expect(recorder.callsOf(1, 'eq')).toEqual([['registrations.event_id', EVENT]])
  })

  it('answers 403 for an event of another organization, before reading orders', async () => {
    const { response, recorder } = await call(`?event=${EVENT}`, [{ data: null }])
    expect(response.status).toBe(403)
    expect(recorder.queries).toHaveLength(1)
  })

  it('answers 400 on a bad status or a forged cursor', async () => {
    expect((await call('?status=lost', [])).response.status).toBe(400)
    expect((await call('?cursor=forged', [])).response.status).toBe(400)
  })

  it('refuses a non-admin', async () => {
    mocks.requireAdminOrganization.mockResolvedValue({ ok: false, response: new Response(null, { status: 403 }) })
    const response = await GET(new Request('http://localhost/api/admin/orders') as never)
    expect(response.status).toBe(403)
    expect(mocks.supabaseAdmin).not.toHaveBeenCalled()
  })
})
