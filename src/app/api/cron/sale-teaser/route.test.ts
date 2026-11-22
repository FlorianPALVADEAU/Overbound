import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, resolveAudienceMock, runCampaignMock, deliverMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  resolveAudienceMock: vi.fn(),
  runCampaignMock: vi.fn(),
  deliverMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/email/audience', () => ({ resolveAudience: resolveAudienceMock }))
vi.mock('@/lib/email/campaign', () => ({ runCampaign: runCampaignMock }))
vi.mock('@/lib/email/transport', () => ({
  deliverMarketingMail: deliverMock,
  getMarketingTransportName: () => 'ses',
  isMarketingTransportConfigured: () => true,
}))
vi.mock('@/lib/sentry', () => ({ captureException: vi.fn() }))

import { GET } from './route'

const EVENT_ROW = {
  id: 'evt-1',
  slug: 'ultra-arena-2027',
  title: 'Overbound - Backyard à obstacles 2027',
  date: '2027-04-24T06:00:00Z',
  location: 'SQY',
  status: 'announced',
  sales_start: '2026-12-01T06:00:00Z',
  tshirt_offer_quota: 60,
}

function mockEventRow(row: typeof EVENT_ROW | null) {
  const query = {
    select: () => query,
    eq: () => query,
    gt: () => query,
    order: () => query,
    limit: () => query,
    maybeSingle: async () => ({ data: row, error: null }),
  }
  supabaseAdminMock.mockReturnValue({ from: () => query })
}

const call = (url = 'https://x.test/api/cron/sale-teaser', secret: string | null = 'secret') =>
  GET(new Request(url, { headers: secret ? { authorization: `Bearer ${secret}` } : {} }) as never)

describe('GET /api/cron/sale-teaser', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-23T08:00:00Z'))
    process.env.CRON_SECRET = 'secret'
    process.env.UNSUBSCRIBE_SECRET = 'test-secret'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://overbound-race.com'
  })

  it('rejects a caller without the cron secret', async () => {
    const response = await call(undefined, 'wrong')

    expect(response.status).toBe(401)
    expect(runCampaignMock).not.toHaveBeenCalled()
  })

  it('does nothing when no event is waiting for its opening', async () => {
    mockEventRow(null)

    const response = await call()

    expect(await response.json()).toEqual({ ok: true, skipped: 'no_event_due' })
    expect(runCampaignMock).not.toHaveBeenCalled()
  })

  it('does nothing when the opening is outside the teaser window', async () => {
    mockEventRow({ ...EVENT_ROW, sales_start: '2027-02-01T06:00:00Z' })

    const response = await call()

    expect(await response.json()).toEqual({ ok: true, skipped: 'no_event_due' })
    expect(runCampaignMock).not.toHaveBeenCalled()
  })

  it('runs one campaign keyed on the event for the events-announcements audience', async () => {
    mockEventRow(EVENT_ROW)
    resolveAudienceMock.mockResolvedValue([{ email: 'a@example.com' }, { email: 'b@example.com' }])
    runCampaignMock.mockResolvedValue({
      total: 2, sent: 2, failed: 0, alreadyDone: 0, suppressed: 0, remaining: 0, ledgerErrors: 0, aborted: null, failures: [],
    })

    const response = await call()
    const body = await response.json()

    expect(resolveAudienceMock).toHaveBeenCalledWith({ listSlugs: ['events-announcements'] })
    expect(runCampaignMock).toHaveBeenCalledWith(
      expect.objectContaining({ campaignKey: 'sale-teaser:evt-1', provider: 'ses' }),
    )
    expect(body).toMatchObject({ ok: true, mode: 'send', sent: 2, remaining: 0 })
  })

  it('reports a partial run as not ok so the second cron entry is known to matter', async () => {
    mockEventRow(EVENT_ROW)
    resolveAudienceMock.mockResolvedValue([{ email: 'a@example.com' }])
    runCampaignMock.mockResolvedValue({
      total: 1, sent: 0, failed: 1, alreadyDone: 0, suppressed: 0, remaining: 0, ledgerErrors: 0, aborted: 'THROWN: boom',
      failures: [{ email: 'a@example.com', error: 'THROWN: boom' }],
    })

    const body = await (await call()).json()

    expect(body).toMatchObject({ ok: false, failed: 1, aborted: 'THROWN: boom' })
  })

  it('counts the audience on dry run without sending', async () => {
    mockEventRow(EVENT_ROW)
    resolveAudienceMock.mockResolvedValue([{ email: 'a@example.com' }])

    const body = await (await call('https://x.test/api/cron/sale-teaser?dry_run=1')).json()

    expect(body).toMatchObject({ ok: true, mode: 'dry_run', total: 1, subject: 'La billetterie ouvre mardi 1er décembre à 7h00' })
    expect(runCampaignMock).not.toHaveBeenCalled()
    expect(deliverMock).not.toHaveBeenCalled()
  })

  it('sends one marked test mail to the given address and touches no audience', async () => {
    mockEventRow(EVENT_ROW)
    deliverMock.mockResolvedValue({ ok: true, messageId: 'm1' })

    const body = await (await call('https://x.test/api/cron/sale-teaser?test=me@example.com')).json()

    expect(body).toMatchObject({ ok: true, mode: 'test', sent: 1 })
    expect(deliverMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'me@example.com', subject: '[TEST] La billetterie ouvre mardi 1er décembre à 7h00' }),
    )
    expect(resolveAudienceMock).not.toHaveBeenCalled()
    expect(runCampaignMock).not.toHaveBeenCalled()
  })

  it('refuses a malformed test address', async () => {
    mockEventRow(EVENT_ROW)

    const response = await call('https://x.test/api/cron/sale-teaser?test=not-an-email')

    expect(response.status).toBe(400)
    expect(deliverMock).not.toHaveBeenCalled()
  })
})
