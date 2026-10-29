import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { supabaseAdminMock, requireAdminMock, listSubscribersMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  requireAdminMock: vi.fn(),
  listSubscribersMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))
vi.mock('@/lib/email/audience', () => ({ listSubscribers: listSubscribersMock }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({
  withRequestLogging: <Handler,>(handler: Handler) => handler,
}))

import { DELETE, GET, POST } from './route'

const LIST_ID = '11111111-1111-4111-8111-111111111111'
const USER_A = '22222222-2222-4222-8222-222222222222'
const USER_B = '33333333-3333-4333-8333-333333333333'
const context = { params: Promise.resolve({ id: LIST_ID }) }

const subscriber = (overrides: Record<string, unknown> = {}) => ({
  id: 'sub-1',
  listId: LIST_ID,
  userId: null,
  email: 'bob@example.com',
  fullName: 'Bob',
  subscribed: true,
  source: 'popup-1',
  subscribedAt: '2026-10-01T00:00:00Z',
  ...overrides,
})

function request(method: string, body?: unknown, search = '') {
  return new NextRequest(`http://localhost/api/admin/distribution-lists/${LIST_ID}/subscribers${search}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

/** One chainable handle per call: every filter returns it, awaiting it yields the result. */
function chain(result: unknown) {
  const handle: Record<string, unknown> = {}
  for (const name of ['select', 'eq', 'in', 'update', 'insert']) {
    handle[name] = vi.fn(() => handle)
  }
  handle.maybeSingle = vi.fn().mockResolvedValue(result)
  handle.then = (onFulfilled: (value: unknown) => unknown) => Promise.resolve(result).then(onFulfilled)
  return handle
}

describe('admin distribution list subscribers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1' } })
  })

  describe('GET', () => {
    beforeEach(() => {
      supabaseAdminMock.mockReturnValue({
        from: () => chain({ data: { id: LIST_ID }, error: null }),
      })
      listSubscribersMock.mockResolvedValue([
        subscriber({ id: 'sub-2', email: 'zed@example.com', fullName: 'Zed' }),
        subscriber({ id: 'sub-1', userId: USER_A, email: 'alice@example.com', fullName: 'Alice' }),
      ])
    })

    it('lists subscribers from the database, email-only ones included', async () => {
      const response = await GET(request('GET'), context)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(listSubscribersMock).toHaveBeenCalledWith([LIST_ID], { subscribedOnly: true })
      expect(body.total).toBe(2)
      expect(body.data.map((row: { user: { email: string } }) => row.user.email)).toEqual([
        'alice@example.com',
        'zed@example.com',
      ])
      expect(body.data[1]).toMatchObject({ id: 'sub-2', user_id: null, list_id: LIST_ID, subscribed: true })
    })

    it('searches on address and name, then paginates', async () => {
      const response = await GET(request('GET', undefined, '?search=ZED&limit=1&offset=0'), context)
      const body = await response.json()

      expect(body.total).toBe(1)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].user.email).toBe('zed@example.com')
    })

    it('answers 404 for an unknown list', async () => {
      supabaseAdminMock.mockReturnValue({ from: () => chain({ data: null, error: null }) })

      expect((await GET(request('GET'), context)).status).toBe(404)
    })
  })

  describe('DELETE', () => {
    it('unsubscribes the subscription instead of deleting the row', async () => {
      const handle = chain({ data: [{ id: 'sub-1' }], error: null })
      supabaseAdminMock.mockReturnValue({ from: () => handle })

      const response = await DELETE(request('DELETE', { subscription_id: 'sub-1' }), context)

      expect(response.status).toBe(200)
      expect(handle.update).toHaveBeenCalledWith(expect.objectContaining({ subscribed: false }))
      expect(handle.eq).toHaveBeenCalledWith('id', 'sub-1')
      expect(handle.eq).toHaveBeenCalledWith('list_id', LIST_ID)
    })

    it('answers 404 when the subscription is not on this list', async () => {
      supabaseAdminMock.mockReturnValue({ from: () => chain({ data: [], error: null }) })

      expect((await DELETE(request('DELETE', { subscription_id: 'other' }), context)).status).toBe(404)
    })

    it('answers 400 without a subscription id', async () => {
      expect((await DELETE(request('DELETE', {}), context)).status).toBe(400)
    })
  })

  describe('POST', () => {
    it('rejects ids that are not uuids before touching the database', async () => {
      const response = await POST(request('POST', { user_ids: ['not-a-uuid'] }), context)

      expect(response.status).toBe(400)
      expect(supabaseAdminMock).not.toHaveBeenCalled()
    })

    it('re-subscribes existing rows and inserts the missing ones', async () => {
      const handles: Record<string, ReturnType<typeof chain>[]> = {
        distribution_lists: [chain({ data: { id: LIST_ID }, error: null })],
        profiles: [chain({ data: [{ id: USER_A }, { id: USER_B }], error: null })],
        list_subscriptions: [
          chain({ data: [{ id: 'sub-a', user_id: USER_A }], error: null }),
          chain({ error: null }),
          chain({ error: null }),
        ],
      }
      supabaseAdminMock.mockReturnValue({
        from: (table: string) => handles[table].shift(),
      })

      const response = await POST(request('POST', { user_ids: [USER_A, USER_B] }), context)
      const body = await response.json()

      expect(response.status).toBe(201)
      expect(body.data.subscribed_user_ids).toEqual([USER_A, USER_B])
    })
  })
})
