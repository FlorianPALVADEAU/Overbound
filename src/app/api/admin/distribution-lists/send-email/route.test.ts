import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireAdminMock, runCampaignMock, resolveAudienceMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  runCampaignMock: vi.fn(),
  resolveAudienceMock: vi.fn(),
}))

vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: requireAdminMock }))
vi.mock('@/lib/logging/adminRequestLogger', () => ({ withRequestLogging: <T,>(handler: T) => handler }))
vi.mock('@/lib/email/segmentedAudience', () => ({ resolveSegmentedAudience: resolveAudienceMock }))
vi.mock('@/lib/email/campaign', () => ({ runCampaign: runCampaignMock }))
vi.mock('@/lib/email/transport', () => ({
  deliverMarketingMail: vi.fn(),
  getMarketingTransportName: () => 'ses',
  isMarketingTransportConfigured: () => true,
}))
vi.mock('@/lib/email/unsubscribe', () => ({ generateMarketingUnsubscribeUrl: () => 'https://example.test/unsub' }))
vi.mock('@/lib/email/wrapWithLayout', () => ({ wrapHtmlWithLayout: (html: string) => html }))
vi.mock('@/lib/sentry', () => ({ captureException: vi.fn() }))

import { POST } from './route'

const request = (body: string) =>
  new Request('http://localhost/api/admin/distribution-lists/send-email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  }) as never

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminMock.mockResolvedValue({ ok: true, user: { id: 'admin-1', email: 'admin@example.test' } })
})

describe('POST /api/admin/distribution-lists/send-email', () => {
  it('never resolves an audience or sends when the body is not JSON', async () => {
    const response = await POST(request('{pas du json'))

    expect(response.status).toBe(400)
    expect(resolveAudienceMock).not.toHaveBeenCalled()
    expect(runCampaignMock).not.toHaveBeenCalled()
  })

  it('never sends when the body is valid JSON but misses the required fields', async () => {
    const response = await POST(request(JSON.stringify({ subject: '' })))

    expect(response.status).toBe(400)
    expect(runCampaignMock).not.toHaveBeenCalled()
  })

  it('narrows the audience to the chosen segment and event, and runs one campaign per segment', async () => {
    resolveAudienceMock.mockResolvedValue([{ email: 'buyer@example.test', userId: 'u1' }])
    runCampaignMock.mockResolvedValue({
      total: 1, sent: 1, failed: 0, alreadyDone: 0, suppressed: 0, remaining: 0, ledgerErrors: 0, aborted: null, failures: [],
    })
    const EVENT_ID = '11111111-1111-4111-8111-111111111111'
    const body = {
      subject: 'Infos', bodyHtml: '<p>Salut</p>', listIds: ['list-1'], segment: 'registered', eventId: EVENT_ID,
    }

    await POST(request(JSON.stringify(body)))
    await POST(request(JSON.stringify({ ...body, segment: 'not_registered' })))

    expect(resolveAudienceMock).toHaveBeenNthCalledWith(1, { listIds: ['list-1'], segment: 'registered', eventId: EVENT_ID })
    const keys = runCampaignMock.mock.calls.map((call) => call[0].campaignKey)
    expect(keys[0]).not.toBe(keys[1])
  })

  it('refuses an unknown segment without resolving an audience', async () => {
    const response = await POST(
      request(JSON.stringify({ subject: 'Infos', bodyHtml: '<p>x</p>', listIds: ['l'], segment: 'everyone-ever' })),
    )

    expect(response.status).toBe(400)
    expect(resolveAudienceMock).not.toHaveBeenCalled()
  })
})
