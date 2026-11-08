import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  loadConsentChoices: vi.fn(),
  applyConsentChoices: vi.fn(),
}))

vi.mock('@/lib/email/reconsentStore', () => ({
  loadConsentChoices: mocks.loadConsentChoices,
  applyConsentChoices: mocks.applyConsentChoices,
}))

import { GET, POST } from './route'
import { generateReconsentUrl, generateUnsubscribeUrl } from '@/lib/email/unsubscribe'

const LIST_ID = '11111111-1111-4111-8111-111111111111'
const tokenFrom = (url: string) => url.split('/').pop() as string

beforeEach(() => {
  vi.clearAllMocks()
  process.env.UNSUBSCRIBE_SECRET = 'test-secret'
  process.env.NEXT_PUBLIC_SITE_URL = 'https://example.test'
})

const get = (token?: string) =>
  GET(new NextRequest(`http://localhost/api/consent/reconfirm${token ? `?token=${token}` : ''}`))

const post = (body: unknown) =>
  POST(
    new NextRequest('http://localhost/api/consent/reconfirm', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  )

describe('GET /api/consent/reconfirm', () => {
  it('returns the choices for a valid re-consent token', async () => {
    mocks.loadConsentChoices.mockResolvedValue([{ id: LIST_ID, name: 'Annonces', description: null, checked: false }])
    const token = tokenFrom(generateReconsentUrl({ email: 'Ann@Example.com', userId: 'user-1' }))

    const response = await get(token)

    expect(response.status).toBe(200)
    expect(mocks.loadConsentChoices).toHaveBeenCalledWith({ email: 'ann@example.com', userId: 'user-1' })
    expect((await response.json()).choices).toHaveLength(1)
  })

  it('refuses an unsubscribe token: it must never open a subscription', async () => {
    const token = tokenFrom(generateUnsubscribeUrl('user-1', 'ann@example.com'))

    const response = await get(token)

    expect(response.status).toBe(400)
    expect(mocks.loadConsentChoices).not.toHaveBeenCalled()
  })

  it('refuses a missing or forged token', async () => {
    expect((await get()).status).toBe(400)
    expect((await get('forged.token')).status).toBe(400)
  })
})

describe('POST /api/consent/reconfirm', () => {
  it('stores the chosen lists for the address in the token', async () => {
    mocks.applyConsentChoices.mockResolvedValue({ accepted: 1 })
    const token = tokenFrom(generateReconsentUrl({ email: 'bob@example.com' }))

    const response = await post({ token, listIds: [LIST_ID] })

    expect(response.status).toBe(200)
    expect(mocks.applyConsentChoices).toHaveBeenCalledWith({ email: 'bob@example.com' }, [LIST_ID])
    expect(await response.json()).toEqual({ success: true, accepted: 1 })
  })

  it('accepts an empty answer: the person declines everything', async () => {
    mocks.applyConsentChoices.mockResolvedValue({ accepted: 0 })
    const token = tokenFrom(generateReconsentUrl({ email: 'bob@example.com' }))

    const response = await post({ token, listIds: [] })

    expect(response.status).toBe(200)
    expect(mocks.applyConsentChoices).toHaveBeenCalledWith({ email: 'bob@example.com' }, [])
  })

  it('refuses an unsubscribe token and a malformed body without writing', async () => {
    const unsubscribeToken = tokenFrom(generateUnsubscribeUrl('user-1', 'ann@example.com'))

    expect((await post({ token: unsubscribeToken, listIds: [LIST_ID] })).status).toBe(400)
    expect((await post({ token: 'x', listIds: ['not-a-uuid'] })).status).toBe(400)
    expect(mocks.applyConsentChoices).not.toHaveBeenCalled()
  })
})
