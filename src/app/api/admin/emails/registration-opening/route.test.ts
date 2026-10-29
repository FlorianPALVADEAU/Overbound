import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  buildAudience: vi.fn(),
  runCampaign: vi.fn(),
  deliver: vi.fn(),
  configured: vi.fn(),
  renderEmail: vi.fn(),
}))

vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: mocks.requireAdmin }))
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: async () => ({
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { full_name: 'Admin' } }) }) }) }),
  }),
}))
vi.mock('@/lib/email/adminCampaigns', () => ({ buildUnifiedCampaignAudience: mocks.buildAudience }))
vi.mock('@/lib/email/campaign', () => ({ runCampaign: mocks.runCampaign }))
vi.mock('@/lib/email/transport', () => ({
  deliverMarketingMail: mocks.deliver,
  isMarketingTransportConfigured: mocks.configured,
  getMarketingTransportName: () => 'ses',
}))
vi.mock('@/lib/email/render', () => ({ renderEmail: mocks.renderEmail }))
vi.mock('@/lib/email/unsubscribe', () => ({
  generateMarketingUnsubscribeUrl: ({ email }: { email: string }) => `https://site.test/unsubscribe/${email}`,
}))
vi.mock('@/lib/logging/adminRequestLogger', () => ({
  withRequestLogging: <Handler,>(handler: Handler) => handler,
}))

import { POST } from './route'

const post = async (body: Record<string, unknown>) => {
  const response = await POST(
    new NextRequest('http://localhost/api/admin/emails/registration-opening', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  )
  if (!response) throw new Error('route returned no response')
  return response
}

const recipients = [
  { email: 'a@x.fr', userId: 'u1', fullName: 'A', sources: ['list_subscriptions'] },
  { email: 'b@x.fr', fullName: null, sources: ['list_subscriptions'] },
]

const campaignReport = (overrides: Record<string, unknown> = {}) => ({
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

describe('POST /api/admin/emails/registration-opening', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireAdmin.mockResolvedValue({ ok: true, user: { id: 'admin-1', email: 'admin@x.fr', user_metadata: {} } })
    mocks.configured.mockReturnValue(true)
    mocks.buildAudience.mockResolvedValue({ recipients, stats: { totalUnique: 2 } })
    mocks.renderEmail.mockResolvedValue('<html>mail</html>')
    mocks.deliver.mockResolvedValue({ ok: true, messageId: 'm1' })
    mocks.runCampaign.mockResolvedValue(campaignReport())
  })

  it('refuses a full send without a matching dry-run token', async () => {
    const response = await post({ mode: 'all', dryRunToken: 'stale' })

    expect(response.status).toBe(409)
    expect(mocks.runCampaign).not.toHaveBeenCalled()
  })

  it('runs the campaign after a dry run and mails every recipient with an unsubscribe link', async () => {
    const dryRun = await (await post({ mode: 'dry_run' })).json()

    const response = await post({ mode: 'all', dryRunToken: dryRun.dryRunToken })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({ success: true, sent: 2 })
    expect(mocks.runCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ campaignKey: 'registration-opening:ultra-arena-2026', provider: 'ses' }),
    )

    const { send } = mocks.runCampaign.mock.calls[0][0]
    await send(recipients[1])
    expect(mocks.deliver).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'b@x.fr', unsubscribeUrl: 'https://site.test/unsubscribe/b@x.fr' }),
    )
  })

  it('asks for a rerun when the campaign stopped early', async () => {
    mocks.runCampaign.mockResolvedValue(campaignReport({ sent: 1, remaining: 1 }))
    const dryRun = await (await post({ mode: 'dry_run' })).json()

    const json = await (await post({ mode: 'all', dryRunToken: dryRun.dryRunToken })).json()

    expect(json.success).toBe(false)
    expect(json.message).toContain('Relance')
  })

  it('sends the test mail to the admin only, and reports a rejection', async () => {
    expect((await post({ mode: 'self' })).status).toBe(200)
    expect(mocks.deliver).toHaveBeenCalledWith(expect.objectContaining({ to: 'admin@x.fr' }))
    expect(mocks.runCampaign).not.toHaveBeenCalled()

    mocks.deliver.mockResolvedValue({ ok: false, error: { kind: 'permanent', code: 'MessageRejected', message: 'no' } })
    expect((await post({ mode: 'self' })).status).toBe(502)
  })

  it('refuses to start when the marketing transport is not configured', async () => {
    mocks.configured.mockReturnValue(false)

    expect((await post({ mode: 'dry_run' })).status).toBe(500)
  })
})
