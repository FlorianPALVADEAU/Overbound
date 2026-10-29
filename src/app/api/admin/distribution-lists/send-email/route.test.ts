import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  resolveAudience: vi.fn(),
  runCampaign: vi.fn(),
  deliver: vi.fn(),
  configured: vi.fn(),
}))

vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: mocks.requireAdmin }))
vi.mock('@/lib/email/audience', () => ({ resolveAudience: mocks.resolveAudience }))
vi.mock('@/lib/email/campaign', () => ({ runCampaign: mocks.runCampaign }))
vi.mock('@/lib/email/transport', () => ({
  deliverMarketingMail: mocks.deliver,
  isMarketingTransportConfigured: mocks.configured,
  getMarketingTransportName: () => 'ses',
}))
vi.mock('@/lib/email/unsubscribe', () => ({
  generateMarketingUnsubscribeUrl: ({ email }: { email: string }) => `https://site.test/unsubscribe/${email}`,
}))
vi.mock('@/lib/sentry', () => ({ captureException: vi.fn() }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({
  withRequestLogging: <Handler,>(handler: Handler) => handler,
}))

import { POST } from './route'

const body = {
  subject: 'Nouveautés',
  bodyHtml: '<p>Salut</p>',
  listIds: ['list-b', 'list-a'],
}

const post = (overrides: Record<string, unknown> = {}) =>
  POST(
    new NextRequest('http://localhost/api/admin/distribution-lists/send-email', {
      method: 'POST',
      body: JSON.stringify({ ...body, ...overrides }),
    }),
  )

const report = (overrides: Record<string, unknown> = {}) => ({
  total: 2,
  sent: 2,
  failed: 0,
  alreadyDone: 0,
  suppressed: 0,
  remaining: 0,
  ledgerErrors: 0,
  aborted: null,
  failures: [],
  ...overrides,
})

describe('POST /api/admin/distribution-lists/send-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireAdmin.mockResolvedValue({ ok: true, user: { id: 'admin-1', email: 'admin@x.fr' } })
    mocks.configured.mockReturnValue(true)
    mocks.resolveAudience.mockResolvedValue([
      { userId: 'u1', email: 'a@x.fr', fullName: 'A' },
      { userId: null, email: 'b@x.fr', fullName: null },
    ])
    mocks.runCampaign.mockResolvedValue(report())
    mocks.deliver.mockResolvedValue({ ok: true, messageId: 'm1' })
  })

  it('runs one campaign over the Supabase audience and reports the result', async () => {
    const response = await post()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.resolveAudience).toHaveBeenCalledWith({ listIds: ['list-b', 'list-a'] })
    expect(json).toMatchObject({ success: true, sent: 2, remaining: 0 })
  })

  it('derives the same campaign key whatever the order of the lists, so a rerun resumes it', async () => {
    await post()
    await post({ listIds: ['list-a', 'list-b'] })
    await post({ subject: 'Autre sujet' })

    const keys = mocks.runCampaign.mock.calls.map(([options]) => options.campaignKey)
    expect(keys[0]).toBe(keys[1])
    expect(keys[2]).not.toBe(keys[0])
  })

  it('gives every recipient, with or without an account, a personal unsubscribe link', async () => {
    await post()
    const { send } = mocks.runCampaign.mock.calls[0][0]

    await send({ email: 'b@x.fr', userId: null })

    expect(mocks.deliver).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'b@x.fr',
        subject: 'Nouveautés',
        unsubscribeUrl: 'https://site.test/unsubscribe/b@x.fr',
        html: expect.stringContaining('https://site.test/unsubscribe/b@x.fr'),
      }),
    )
  })

  it('tells the admin to run the campaign again when it stopped early', async () => {
    mocks.runCampaign.mockResolvedValue(report({ sent: 1, remaining: 1 }))

    const json = await (await post()).json()

    expect(json.success).toBe(false)
    expect(json.message).toContain('again')
    expect(json.remaining).toBe(1)
  })

  it('answers 502 when nothing could be sent', async () => {
    mocks.runCampaign.mockResolvedValue(report({ sent: 0, failed: 2, aborted: 'AccessDenied' }))

    expect((await post()).status).toBe(502)
  })

  it('sends only to the admin in test mode, without a campaign', async () => {
    const response = await post({ testMode: true })

    expect(response.status).toBe(200)
    expect(mocks.runCampaign).not.toHaveBeenCalled()
    expect(mocks.deliver).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'admin@x.fr', subject: '[TEST] Nouveautés' }),
    )
  })

  it('reports a rejected test mail instead of claiming success', async () => {
    mocks.deliver.mockResolvedValue({ ok: false, error: { kind: 'permanent', code: 'MessageRejected', message: 'no' } })

    expect((await post({ testMode: true })).status).toBe(502)
  })

  it('refuses to start when the marketing transport is not configured', async () => {
    mocks.configured.mockReturnValue(false)

    expect((await post()).status).toBe(500)
    expect(mocks.resolveAudience).not.toHaveBeenCalled()
  })

  it('does not send when the audience cannot be read', async () => {
    mocks.resolveAudience.mockRejectedValue(new Error('db down'))

    expect((await post()).status).toBe(500)
    expect(mocks.runCampaign).not.toHaveBeenCalled()
  })

  it('answers 400 when the lists have no subscriber', async () => {
    mocks.resolveAudience.mockResolvedValue([])

    expect((await post()).status).toBe(400)
  })
})
