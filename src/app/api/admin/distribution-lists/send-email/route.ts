import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { resolveAudience } from '@/lib/email/audience'
import { runCampaign, type CampaignRecipient } from '@/lib/email/campaign'
import {
  deliverMarketingMail,
  getMarketingTransportName,
  isMarketingTransportConfigured,
} from '@/lib/email/transport'
import { generateMarketingUnsubscribeUrl } from '@/lib/email/unsubscribe'
import { wrapHtmlWithLayout } from '@/lib/email/wrapWithLayout'
import { captureException } from '@/lib/sentry'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

// A campaign to a few thousand addresses is paced; it stops on its time budget and is resumed by a rerun.
export const maxDuration = 60

const sendEmailSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  preheader: z.string().optional(),
  bodyHtml: z.string().min(1, 'HTML body is required'),
  bodyText: z.string().optional(),
  listIds: z.array(z.string()).min(1, 'At least one list is required'),
  testMode: z.boolean().default(false),
})

/**
 * POST /api/admin/distribution-lists/send-email
 * Send an email to distribution list subscribers (admin only)
 */
async function handlePost(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }
    const user = auth.user

    // Parse and validate request body
    const body = await request.json()
    const validatedData = sendEmailSchema.parse(body)

    if (!isMarketingTransportConfigured()) {
      return NextResponse.json(
        { error: `Marketing transport "${getMarketingTransportName()}" is not configured` },
        { status: 500 },
      )
    }

    const buildMessage = (recipient: CampaignRecipient, subject: string) => {
      const unsubscribeUrl = generateMarketingUnsubscribeUrl({
        email: recipient.email,
        userId: recipient.userId,
      })
      return {
        to: recipient.email,
        subject,
        html: wrapHtmlWithLayout({
          htmlContent: validatedData.bodyHtml,
          unsubscribeUrl,
          preview: validatedData.preheader,
        }),
        text: validatedData.bodyText || undefined,
        unsubscribeUrl,
      }
    }

    // Test mode: send only to the admin user
    if (validatedData.testMode) {
      const result = await deliverMarketingMail(
        buildMessage({ email: user.email!, userId: user.id }, `[TEST] ${validatedData.subject}`),
      )
      if (!result.ok) {
        console.error('Error sending test email:', result.error)
        captureException(new Error(result.error.message), {
          context: 'test_email_send',
          adminEmail: user.email,
          subject: validatedData.subject,
          code: result.error.code,
        })
        return NextResponse.json(
          { error: `Failed to send test email: ${result.error.code}` },
          { status: 502 },
        )
      }
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        recipientCount: 1,
      })
    }

    // Production mode: the audience comes from Supabase (subscribed, not suppressed, digest-compatible)
    let audience: CampaignRecipient[]
    try {
      audience = await resolveAudience({ listIds: validatedData.listIds })
    } catch (error) {
      console.error('Error resolving audience:', error)
      captureException(error as Error, {
        context: 'audience_resolution',
        listIds: validatedData.listIds,
      })
      return NextResponse.json(
        { error: 'Failed to resolve distribution list audience' },
        { status: 500 },
      )
    }

    if (audience.length === 0) {
      return NextResponse.json(
        { error: 'No subscribers found for the selected lists' },
        { status: 400 },
      )
    }

    // Same lists and same content = same campaign: a rerun resumes it and never mails an address twice.
    const campaignKey = `distribution-list:${createHash('sha256')
      .update(
        JSON.stringify([
          [...validatedData.listIds].sort(),
          validatedData.subject,
          validatedData.preheader ?? '',
          validatedData.bodyHtml,
          validatedData.bodyText ?? '',
        ]),
      )
      .digest('hex')
      .slice(0, 32)}`

    try {
      const report = await runCampaign({
        campaignKey,
        provider: getMarketingTransportName(),
        recipients: audience,
        send: (recipient) => deliverMarketingMail(buildMessage(recipient, validatedData.subject)),
      })

      const complete = report.failed === 0 && report.remaining === 0 && !report.aborted
      const nothingSent = report.sent === 0 && report.alreadyDone === 0 && report.failed > 0
      const message = complete
        ? `Emails sent: ${report.sent}, already sent earlier: ${report.alreadyDone}`
        : `Partial send: ${report.sent} sent, ${report.failed} failed, ${report.remaining} left. Run the same campaign again to continue.`

      return NextResponse.json(
        {
          success: complete,
          message,
          recipientCount: report.total,
          sent: report.sent,
          failed: report.failed,
          remaining: report.remaining,
          alreadyDone: report.alreadyDone,
          suppressed: report.suppressed,
          aborted: report.aborted,
          failures: report.failures.slice(0, 20),
        },
        { status: nothingSent ? 502 : 200 },
      )
    } catch (error) {
      console.error('Error sending emails:', error)
      captureException(error as Error, {
        context: 'bulk_email_send',
        listIds: validatedData.listIds,
        recipientCount: audience.length,
        subject: validatedData.subject,
      })
      return NextResponse.json(
        { error: 'Failed to send emails to subscribers' },
        { status: 500 },
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 },
      )
    }

    // Capture unexpected errors
    captureException(error as Error, {
      route: '/api/admin/distribution-lists/send-email',
      method: 'POST',
    })

    console.error('Error in send-email route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Envoi campagne liste de distribution admin',
})
