import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { sendMarketingEmail } from '@/lib/email/marketing'
import type { MarketingRecipient } from '@/lib/email/marketing'
import { generateUnsubscribeUrl } from '@/lib/email/unsubscribe'
import { wrapHtmlWithLayout } from '@/lib/email/wrapWithLayout'

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
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = sendEmailSchema.parse(body)

    // Test mode: send only to the admin user
    if (validatedData.testMode) {
      try {
        await sendMarketingEmail(
          'custom_marketing_email' as any,
          [
            {
              email: user.email!,
              userId: user.id,
            },
          ],
          async (recipient: MarketingRecipient) => {
            const { Resend } = await import('resend')
            const resend = new Resend(process.env.RESEND_API_KEY!)

            // Generate unsubscribe URL for test email
            const unsubscribeUrl = recipient.userId
              ? generateUnsubscribeUrl(recipient.userId, recipient.email)
              : undefined

            // Wrap content in EmailLayout with unsubscribe link
            const emailHtml = wrapHtmlWithLayout({
              htmlContent: validatedData.bodyHtml,
              unsubscribeUrl,
              preview: validatedData.preheader,
            })

            await resend.emails.send({
              from: process.env.SEND_FROM_EMAIL || 'noreply@overbound-race.com',
              to: recipient.email,
              subject: `[TEST] ${validatedData.subject}`,
              html: emailHtml,
              text: validatedData.bodyText || undefined,
              headers: unsubscribeUrl ? {
                'X-Test-Mode': 'true',
                'List-Unsubscribe': `<${unsubscribeUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              } : {
                'X-Test-Mode': 'true',
              },
            })
          },
          {
            test_mode: true,
            email_subject: validatedData.subject,
            preheader: validatedData.preheader,
          },
        )

        return NextResponse.json({
          success: true,
          message: 'Test email sent successfully',
          recipientCount: 1,
        })
      } catch (error) {
        console.error('Error sending test email:', error)
        return NextResponse.json(
          { error: 'Failed to send test email' },
          { status: 500 },
        )
      }
    }

    // Production mode: get all subscribers from selected lists
    const { data: subscribers, error: subscribersError } = await supabase
      .from('list_subscriptions')
      .select(
        `
        user_id,
        subscribed,
        users:user_id (
          email
        )
      `,
      )
      .in('list_id', validatedData.listIds)
      .eq('subscribed', true)

    if (subscribersError) {
      console.error('Error fetching subscribers:', subscribersError)
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 },
      )
    }

    // Remove duplicates (users subscribed to multiple lists)
        const uniqueSubscribers = Array.from(
          new Map(
            subscribers
              .filter((sub) => {
                if (!sub.users) return false
                const u = sub.users as any
                if (Array.isArray(u)) {
                  return u.length > 0 && !!u[0]?.email
                }
                return !!u.email
              })
              .map((sub) => {
                const u = sub.users as any
                const email = Array.isArray(u) ? u[0]?.email : u?.email
                return [
                  sub.user_id,
                  {
                    email: email as string,
                    userId: sub.user_id,
                  },
                ]
              }),
          ).values(),
        )

    if (uniqueSubscribers.length === 0) {
      return NextResponse.json(
        { error: 'No subscribers found for the selected lists' },
        { status: 400 },
      )
    }

    // Send emails to all subscribers
    try {
      await sendMarketingEmail(
        'custom_marketing_email' as any,
        uniqueSubscribers,
        async (recipient: MarketingRecipient) => {
          const { Resend } = await import('resend')
          const resend = new Resend(process.env.RESEND_API_KEY!)

          // Generate unsubscribe URL for each recipient
          const unsubscribeUrl = recipient.userId
            ? generateUnsubscribeUrl(recipient.userId, recipient.email)
            : undefined

          // Wrap content in EmailLayout with unsubscribe link
          const emailHtml = wrapHtmlWithLayout({
            htmlContent: validatedData.bodyHtml,
            unsubscribeUrl,
            preview: validatedData.preheader,
          })

          await resend.emails.send({
            from: process.env.SEND_FROM_EMAIL || 'noreply@overbound-race.com',
            to: recipient.email,
            subject: validatedData.subject,
            html: emailHtml,
            text: validatedData.bodyText || undefined,
            headers: unsubscribeUrl ? {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            } : undefined,
          })
        },
        {
          email_subject: validatedData.subject,
          preheader: validatedData.preheader,
          list_ids: validatedData.listIds,
        },
      )

      return NextResponse.json({
        success: true,
        message: 'Emails sent successfully',
        recipientCount: uniqueSubscribers.length,
      })
    } catch (error) {
      console.error('Error sending emails:', error)
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

    console.error('Error in send-email route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
