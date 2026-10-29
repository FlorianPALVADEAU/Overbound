import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  supabaseAdmin: vi.fn(),
  sendConfirmation: vi.fn(),
  subscribeResend: vi.fn(),
  markUnregistered: vi.fn(),
}))

vi.mock('@/lib/rateLimit', () => ({
  getClientIp: () => '127.0.0.1',
  rateLimit: () => ({ allowed: true }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
  supabaseAdmin: mocks.supabaseAdmin,
}))
vi.mock('@/lib/email', () => ({ sendPopupSubscribeConfirmationEmail: mocks.sendConfirmation }))
vi.mock('@/lib/email/resendAudiences', () => ({
  mapSlugsToAudienceIds: () => ({ resolved: [], audienceIds: [], missingSlugs: ['events-announcements'] }),
  subscribeResendContactToAudiences: mocks.subscribeResend,
  markResendContactAsUnregistered: mocks.markUnregistered,
}))

import { POST } from './route'

const PROMOTION_ID = '11111111-1111-4111-8111-111111111111'

/** Chainable query double: filters return the handle, awaiting it yields the result. */
function chain(result: unknown) {
  const handle: Record<string, unknown> = {}
  for (const name of ['select', 'eq', 'in', 'limit', 'insert']) {
    handle[name] = vi.fn(() => handle)
  }
  handle.single = vi.fn().mockResolvedValue(result)
  handle.then = (onFulfilled: (value: unknown) => unknown) => Promise.resolve(result).then(onFulfilled)
  return handle
}

function request() {
  return new NextRequest('http://localhost/api/promotions/popup-subscribe', {
    method: 'POST',
    body: JSON.stringify({
      email: 'New@Example.com',
      full_name: 'New Runner',
      promotion_id: PROMOTION_ID,
    }),
  })
}

describe('POST /api/promotions/popup-subscribe', () => {
  let insertHandle: ReturnType<typeof chain>

  beforeEach(() => {
    vi.clearAllMocks()
    insertHandle = chain({ error: null })

    mocks.createClient.mockResolvedValue({
      from: (table: string) =>
        table === 'site_promotions'
          ? chain({ data: { id: PROMOTION_ID, type: 'popup', is_active: true }, error: null })
          : chain({ data: [{ id: 'list-1', slug: 'events-announcements' }], error: null }),
    })

    const subscriptionQueries = [chain({ data: [], error: null }), chain({ data: [], error: null }), insertHandle]
    mocks.supabaseAdmin.mockReturnValue({
      auth: { admin: { listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }) } },
      from: () => subscriptionQueries.shift(),
    })
  })

  it('stores the subscription in Supabase when no Resend audience is configured', async () => {
    const response = await POST(request())

    expect(response.status).toBe(201)
    expect(insertHandle.insert).toHaveBeenCalledWith([
      expect.objectContaining({ list_id: 'list-1', user_id: null, email: 'new@example.com', subscribed: true }),
    ])
    expect(mocks.sendConfirmation).toHaveBeenCalledTimes(1)
  })

  it('still confirms the subscription when the Resend projection fails', async () => {
    mocks.markUnregistered.mockRejectedValue(new Error('resend down'))

    const response = await POST(request())

    expect(response.status).toBe(201)
    expect(insertHandle.insert).toHaveBeenCalledTimes(1)
  })
})
