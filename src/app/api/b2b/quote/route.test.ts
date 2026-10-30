import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, notifyMock, confirmMock, rateLimitMock, turnstileMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  notifyMock: vi.fn(),
  confirmMock: vi.fn(),
  rateLimitMock: vi.fn(),
  turnstileMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/email', () => ({
  sendB2bQuoteRequestEmail: notifyMock,
  sendB2bQuoteConfirmationEmail: confirmMock,
}))
vi.mock('@/lib/sentry', () => ({ captureException: vi.fn() }))
vi.mock('@/lib/seo/loadNextEdition', () => ({
  loadNextEdition: async () => ({ window: 'entre avril et juin 2027', detailsStatus: 'Lieu à confirmer.' }),
}))
vi.mock('@/lib/security/turnstile', () => ({ verifyTurnstileToken: turnstileMock }))
vi.mock('@/lib/rateLimit', () => ({ getClientIp: () => '1.2.3.4', rateLimit: rateLimitMock }))

import { POST } from './route'

const VALID = {
  companyName: 'Acme',
  fullName: 'Claire Martin',
  email: 'claire@acme.fr',
  teamSize: '10-19',
  projectType: 'tickets',
  utm: { utm_source: 'linkedin' },
}

const post = (body: unknown) =>
  POST(new Request('http://localhost/api/b2b/quote', { method: 'POST', body: JSON.stringify(body) }) as never)

const mockInsert = (error: { message: string } | null = null) => {
  const insert = vi.fn().mockResolvedValue({ error })
  supabaseAdminMock.mockReturnValue({ from: () => ({ insert }) })
  return insert
}

describe('POST /api/b2b/quote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rateLimitMock.mockReturnValue({ allowed: true })
    turnstileMock.mockResolvedValue({ ok: true, skipped: false })
    notifyMock.mockResolvedValue({})
    confirmMock.mockResolvedValue({})
  })

  it('stores the request and sends both emails', async () => {
    const insert = mockInsert()
    const response = await post(VALID)
    expect(response.status).toBe(201)
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ company_name: 'Acme', email: 'claire@acme.fr', utm: { utm_source: 'linkedin' } }),
    )
    expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({ replyTo: 'claire@acme.fr', teamSizeLabel: '10 à 19' }))
    expect(confirmMock).toHaveBeenCalledOnce()
    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({ editionWindow: 'entre avril et juin 2027', editionStatus: 'Lieu à confirmer.' }),
    )
  })

  it('answers 400 with field errors and stores nothing', async () => {
    const insert = mockInsert()
    const response = await post({ ...VALID, email: 'nope' })
    expect(response.status).toBe(400)
    expect((await response.json()).fields.email).toBeDefined()
    expect(insert).not.toHaveBeenCalled()
  })

  it('pretends success to a bot and stores nothing', async () => {
    const insert = mockInsert()
    const response = await post({ ...VALID, website: 'http://spam' })
    expect(response.status).toBe(201)
    expect(insert).not.toHaveBeenCalled()
    expect(notifyMock).not.toHaveBeenCalled()
  })

  it('answers 403 and stores nothing when the anti-spam check fails', async () => {
    turnstileMock.mockResolvedValue({ ok: false, reason: 'rejected' })
    const insert = mockInsert()
    const response = await post({ ...VALID, turnstileToken: 'bad' })
    expect(response.status).toBe(403)
    expect(turnstileMock).toHaveBeenCalledWith('bad', '1.2.3.4')
    expect(insert).not.toHaveBeenCalled()
  })

  it('answers 429 when the rate limit is hit', async () => {
    rateLimitMock.mockReturnValue({ allowed: false })
    const insert = mockInsert()
    expect((await post(VALID)).status).toBe(429)
    expect(insert).not.toHaveBeenCalled()
  })

  it('answers 500 and sends no email when the insert fails', async () => {
    mockInsert({ message: 'relation does not exist' })
    expect((await post(VALID)).status).toBe(500)
    expect(notifyMock).not.toHaveBeenCalled()
  })

  it('still answers 201 when an email fails, the request being saved', async () => {
    mockInsert()
    notifyMock.mockRejectedValue(new Error('resend down'))
    expect((await post(VALID)).status).toBe(201)
  })
})
