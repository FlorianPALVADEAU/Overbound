import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import SaleTeaserEmail from '@/emails/SaleTeaserEmail'
import { renderEmail } from '@/lib/email/render'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'
import { resolveAudience } from '@/lib/email/audience'
import { runCampaign, type CampaignRecipient } from '@/lib/email/campaign'
import {
  deliverMarketingMail,
  getMarketingTransportName,
  isMarketingTransportConfigured,
} from '@/lib/email/transport'
import { generateMarketingUnsubscribeUrl } from '@/lib/email/unsubscribe'
import {
  buildTeaserContent,
  isTeaserDue,
  teaserCampaignKey,
  type TeaserEvent,
} from '@/lib/email/saleTeaser'
import { captureException } from '@/lib/sentry'

export const runtime = 'nodejs'
// About a thousand addresses at 14 per second; a second cron entry resumes whatever the budget leaves.
export const maxDuration = 300

const SEND_BUDGET_MS = 240_000
const AUDIENCE_LIST_SLUGS = ['events-announcements']

const testAddressSchema = z.string().email()

async function loadEventAwaitingSale(now: Date): Promise<TeaserEvent | null> {
  const { data, error } = await supabaseAdmin()
    .from('events')
    .select('id, slug, title, date, location, status, sales_start, tshirt_offer_quota')
    .eq('status', 'announced')
    .gt('sales_start', now.toISOString())
    .order('sales_start', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`[sale teaser] event read failed: ${error.message}`)
  }
  return (data as TeaserEvent | null) ?? null
}

/**
 * Mail announcing the opening of ticket sales to the marketing audience.
 * Scheduled by vercel.json; `?dry_run=1` counts the audience, `?test=<email>` sends one mail to that address.
 * Same event, same campaign key: running it again resumes, it never mails an address twice.
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  if (!isMarketingTransportConfigured()) {
    return NextResponse.json(
      { ok: false, error: `marketing transport "${getMarketingTransportName()}" is not configured` },
      { status: 500 },
    )
  }

  try {
    const now = new Date()
    const event = await loadEventAwaitingSale(now)
    if (!event || !isTeaserDue(event, now)) {
      return NextResponse.json({ ok: true, skipped: 'no_event_due' })
    }

    const content = buildTeaserContent(event, getEmailAssetsBaseUrl())
    const buildMessage = async (recipient: CampaignRecipient, subject = content.subject) => {
      const unsubscribeUrl = generateMarketingUnsubscribeUrl({ email: recipient.email, userId: recipient.userId })
      const html = await renderEmail(
        SaleTeaserEmail({ firstName: recipient.firstName, content, unsubscribeUrl }),
      )
      return { to: recipient.email, subject, html, unsubscribeUrl }
    }

    const { searchParams } = new URL(request.url)

    const testAddress = searchParams.get('test')
    if (testAddress !== null) {
      const parsed = testAddressSchema.safeParse(testAddress)
      if (!parsed.success) {
        return NextResponse.json({ ok: false, error: 'invalid_test_address' }, { status: 400 })
      }
      const result = await deliverMarketingMail(await buildMessage({ email: parsed.data }, `[TEST] ${content.subject}`))
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: `${result.error.code}: ${result.error.message}` }, { status: 502 })
      }
      return NextResponse.json({ ok: true, mode: 'test', sent: 1 })
    }

    const audience = await resolveAudience({ listSlugs: AUDIENCE_LIST_SLUGS })

    if (searchParams.get('dry_run') === '1') {
      return NextResponse.json({ ok: true, mode: 'dry_run', subject: content.subject, total: audience.length })
    }

    const report = await runCampaign({
      campaignKey: teaserCampaignKey(event),
      provider: getMarketingTransportName(),
      recipients: audience,
      budgetMs: SEND_BUDGET_MS,
      send: async (recipient) => deliverMarketingMail(await buildMessage(recipient)),
    })

    if (report.aborted || report.failed > 0) {
      captureException(new Error(`[sale teaser] ${report.failed} failed, aborted: ${report.aborted ?? 'no'}`), {
        context: 'sale_teaser',
        eventId: event.id,
        failures: report.failures.slice(0, 20),
      })
    }

    return NextResponse.json({
      ok: report.failed === 0 && !report.aborted,
      mode: 'send',
      total: report.total,
      sent: report.sent,
      failed: report.failed,
      alreadyDone: report.alreadyDone,
      suppressed: report.suppressed,
      remaining: report.remaining,
      aborted: report.aborted,
      ledgerErrors: report.ledgerErrors,
      failures: report.failures.slice(0, 20),
    })
  } catch (error) {
    console.error('[sale teaser] failed', error)
    captureException(error instanceof Error ? error : new Error(String(error)), { context: 'sale_teaser' })
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
