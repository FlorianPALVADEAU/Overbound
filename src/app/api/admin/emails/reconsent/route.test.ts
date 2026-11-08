import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  resolveReconsentAudience: vi.fn(),
  runCampaign: vi.fn(),
  deliver: vi.fn(),
  configured: vi.fn(),
  renderEmail: vi.fn(),
}))

vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: mocks.requireAdmin }))
vi.mock('@/lib/email/audience', () => ({ resolveReconsentAudience: mocks.resolveReconsentAudience }))
vi.mock('@/lib/email/campaign', () => ({ runCampaign: mocks.runCampaign }))
vi.mock('@/lib/email/transport', () => ({
  deliverMarketingMail: mocks.deliver,
  isMarketingTransportConfigured: mocks.configured,
  getMarketingTransportName: () => 'ses',
}))
vi.mock('@/lib/email/render', () => ({ renderEmail: mocks.renderEmail }))
vi.mock('@/lib/email/unsubscribe', () => ({
  generateMarketingUnsubscribeUrl: ({ email }: { email: string }) => `https://site.test/unsubscribe/${email}`,
  generateReconsentUrl: ({ email }: { email: string }) => `https://site.test/consent/${email}`,
}))
vi.mock('@/lib/logging/adminRequestLogger', () => ({
  withRequestLogging: <Handler,>(handler: Handler) => handler,
}))

import { POST } from './route'

const post = async (body: Record<string, unknown>) => {
  const response = await POST(
    new NextRequest('http://localhost/api/admin/emails/reconsent', { method: 'POST', body: JSON.stringify(body) }),
  )
  if (!response) throw new Error('route returned no response')
  return response
}

const recipients = [
  { email: 'a@x.fr', userId: 'u1', firstName: 'A' },
  { email: 'b@x.fr', firstName: null },
]

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

describe('POST /api/admin/emails/reconsent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireAdmin.mockResolvedValue({ ok: true, user: { id: 'admin-1', email: 'admin@x.fr' } })
    mocks.configured.mockReturnValue(true)
    mocks.resolveReconsentAudience.mockResolvedValue(recipients)
    mocks.renderEmail.mockResolvedValue('<html>mail</html>')
    mocks.deliver.mockResolvedValue({ ok: true, messageId: 'm1' })
    mocks.runCampaign.mockResolvedValue(report())
  })

  it('refuses anyone who is not an admin', async () => {
    mocks.requireAdmin.mockResolvedValue({ ok: false, response: new Response(null, { status: 403 }) })

    const response = await post({ mode: 'dry_run' })

    expect(response.status).toBe(403)
    expect(mocks.resolveReconsentAudience).not.toHaveBeenCalled()
  })

  it('a dry run counts the audience and sends nothing', async () => {
    const json = await (await post({ mode: 'dry_run' })).json()

    expect(json).toMatchObject({ success: true, total: 2 })
    expect(mocks.runCampaign).not.toHaveBeenCalled()
    expect(mocks.deliver).not.toHaveBeenCalled()
  })

  it('refuses a full send without a matching dry-run token', async () => {
    const response = await post({ mode: 'all', dryRunToken: 'stale' })

    expect(response.status).toBe(409)
    expect(mocks.runCampaign).not.toHaveBeenCalled()
  })

  it('mails each recipient their own confirmation link and an unsubscribe link', async () => {
    const dryRun = await (await post({ mode: 'dry_run' })).json()

    const response = await post({ mode: 'all', dryRunToken: dryRun.dryRunToken })

    expect(response.status).toBe(200)
    expect(mocks.runCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ campaignKey: 'reconsent:2026-11', provider: 'ses' }),
    )
    const { send } = mocks.runCampaign.mock.calls[0][0]
    await send(recipients[1])
    expect(mocks.deliver).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'b@x.fr', unsubscribeUrl: 'https://site.test/unsubscribe/b@x.fr' }),
    )
  })

  it('asks for a rerun when the campaign stopped early', async () => {
    mocks.runCampaign.mockResolvedValue(report({ sent: 1, remaining: 1 }))
    const dryRun = await (await post({ mode: 'dry_run' })).json()

    const json = await (await post({ mode: 'all', dryRunToken: dryRun.dryRunToken })).json()

    expect(json.success).toBe(false)
    expect(json.message).toContain('Relance')
  })

  it('sends a test mail to the admin only', async () => {
    const json = await (await post({ mode: 'self' })).json()

    expect(json).toMatchObject({ success: true, sent: 1 })
    expect(mocks.deliver).toHaveBeenCalledTimes(1)
    expect(mocks.deliver).toHaveBeenCalledWith(expect.objectContaining({ to: 'admin@x.fr' }))
    expect(mocks.runCampaign).not.toHaveBeenCalled()
  })
})
