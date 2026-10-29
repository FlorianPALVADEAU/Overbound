import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  supabaseAdmin: vi.fn(),
  createClient: vi.fn(),
  validateToken: vi.fn(),
  unsubscribeResend: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: mocks.supabaseAdmin,
  createClient: mocks.createClient,
}))
vi.mock('@/lib/email/unsubscribe', () => ({ validateUnsubscribeToken: mocks.validateToken }))
vi.mock('@/lib/email/resendAudiences', () => ({
  DEFAULT_MARKETING_LIST_SLUGS: ['events-announcements'],
  mapSlugsToAudienceIds: () => ({ resolved: [], audienceIds: [], missingSlugs: [] }),
  unsubscribeResendContactFromAudiences: mocks.unsubscribeResend,
}))

import { GET, POST } from './route'

/** Chainable query double: filters return the handle, awaiting it yields the result. */
function chain(result: unknown = { data: null, error: null }) {
  const handle: Record<string, unknown> = {}
  for (const name of ['select', 'update', 'insert', 'eq']) {
    handle[name] = vi.fn(() => handle)
  }
  handle.single = vi.fn().mockResolvedValue(result)
  handle.then = (onFulfilled: (value: unknown) => unknown) => Promise.resolve(result).then(onFulfilled)
  return handle
}

function post(token: string) {
  return new NextRequest('http://localhost/api/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

describe('/api/unsubscribe', () => {
  let subscriptions: ReturnType<typeof chain>

  beforeEach(() => {
    vi.clearAllMocks()
    subscriptions = chain({ error: null })
    mocks.supabaseAdmin.mockReturnValue({
      from: (table: string) => (table === 'list_subscriptions' ? subscriptions : chain({ error: null })),
    })
  })

  it('unsubscribes an email-only subscriber with the service client, since the visitor is logged out', async () => {
    mocks.validateToken.mockReturnValue({ email: 'runner@example.com' })

    const response = await POST(post('signed-token'))

    expect(response.status).toBe(200)
    expect(mocks.supabaseAdmin).toHaveBeenCalled()
    expect(mocks.createClient).not.toHaveBeenCalled()
    expect(subscriptions.update).toHaveBeenCalledWith(expect.objectContaining({ subscribed: false }))
    expect(subscriptions.eq).toHaveBeenCalledWith('email', 'runner@example.com')
  })

  it('supports the one-click GET used by mail clients', async () => {
    mocks.validateToken.mockReturnValue({ email: 'runner@example.com' })

    const response = await GET(new NextRequest('http://localhost/api/unsubscribe?token=signed-token'))

    expect(response.status).toBe(307)
    expect(subscriptions.eq).toHaveBeenCalledWith('email', 'runner@example.com')
  })

  it('rejects an invalid token without touching the database', async () => {
    mocks.validateToken.mockImplementation(() => {
      throw new Error('Invalid token')
    })

    const response = await POST(post('forged'))

    expect(response.status).toBe(400)
    expect(mocks.supabaseAdmin).not.toHaveBeenCalled()
  })
})
