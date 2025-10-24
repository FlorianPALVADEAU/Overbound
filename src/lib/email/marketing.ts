import {
  sendNewEventAnnouncementEmail,
  sendPriceChangeReminderEmail,
  sendPromoCampaignEmail,
} from '@/lib/email'
import { getLastEmailLog, recordEmailLog } from '@/lib/email/emailLogs'
import { supabaseAdmin } from '@/lib/supabase/server'

type MarketingEmailType = 'marketing_new_event' | 'marketing_price_change' | 'marketing_promo'

export interface MarketingRecipient {
  userId?: string | null
  email: string
  fullName?: string | null
}

const DEFAULT_BATCH_SIZE = 200

export async function dispatchNewEventAnnouncement(params: {
  recipients: MarketingRecipient[]
  eventTitle: string
  eventDate: string
  eventLocation: string
  eventUrl: string
  highlight?: string | null
}) {
  await dispatchMarketingEmails('marketing_new_event', params.recipients, async (recipient) => {
    await sendNewEventAnnouncementEmail({
      to: recipient.email,
      fullName: recipient.fullName,
      eventTitle: params.eventTitle,
      eventDate: params.eventDate,
      eventLocation: params.eventLocation,
      eventUrl: params.eventUrl,
      highlight: params.highlight,
    })
  }, {
    event_title: params.eventTitle,
    event_url: params.eventUrl,
  })
}

export async function dispatchPriceChangeReminder(params: {
  recipients: MarketingRecipient[]
  eventTitle: string
  eventDate: string
  deadlineLabel: string
  eventUrl: string
  currentPriceLabel: string
  nextPriceLabel?: string | null
}) {
  await dispatchMarketingEmails('marketing_price_change', params.recipients, async (recipient) => {
    await sendPriceChangeReminderEmail({
      to: recipient.email,
      fullName: recipient.fullName,
      eventTitle: params.eventTitle,
      eventDate: params.eventDate,
      deadlineLabel: params.deadlineLabel,
      eventUrl: params.eventUrl,
      currentPriceLabel: params.currentPriceLabel,
      nextPriceLabel: params.nextPriceLabel,
    })
  }, {
    event_title: params.eventTitle,
    deadline: params.deadlineLabel,
  })
}

export async function dispatchPromoCampaign(params: {
  recipients: MarketingRecipient[]
  title: string
  message: string
  ctaLabel: string
  ctaUrl: string
  promoCode?: string | null
  promoDetails?: string | null
}) {
  await dispatchMarketingEmails('marketing_promo', params.recipients, async (recipient) => {
    await sendPromoCampaignEmail({
      to: recipient.email,
      fullName: recipient.fullName,
      title: params.title,
      message: params.message,
      ctaLabel: params.ctaLabel,
      ctaUrl: params.ctaUrl,
      promoCode: params.promoCode,
      promoDetails: params.promoDetails,
    })
  }, {
    title: params.title,
    promo_code: params.promoCode ?? null,
  })
}

async function dispatchMarketingEmails(
  emailType: MarketingEmailType,
  recipients: MarketingRecipient[],
  sendFn: (recipient: MarketingRecipient) => Promise<void>,
  context: Record<string, unknown> = {},
) {
  if (!process.env.RESEND_API_KEY) {
    return
  }

  const batches = chunkRecipients(recipients, DEFAULT_BATCH_SIZE)

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (recipient) => {
        const logKey = recipient.userId ?? recipient.email

        const alreadySent = await getLastEmailLog({
          userId: logKey,
          emailType,
          contextFilters: context,
        })

        if (alreadySent) {
          return
        }

        await sendFn(recipient)

        await recordEmailLog({
          userId: logKey,
          email: recipient.email,
          emailType,
          context,
        })
      }),
    )
  }
}

function chunkRecipients(recipients: MarketingRecipient[], size: number) {
  const chunks: MarketingRecipient[][] = []
  for (let i = 0; i < recipients.length; i += size) {
    chunks.push(recipients.slice(i, i + size))
  }
  return chunks
}

export async function getMarketingOptInRecipients(): Promise<MarketingRecipient[]> {
  try {
    const admin = supabaseAdmin()
    const { data: profiles, error } = await admin
      .from('profiles')
      .select('id, full_name')
      .eq('marketing_opt_in', true)

    if (error) {
      console.error('[marketing] opt-in profile fetch error', error)
      return []
    }

    if (!profiles || profiles.length === 0) {
      return []
    }

    const profileMap = new Map<string, string | null>(
      profiles.map((profile) => [profile.id, (profile as Record<string, any>).full_name ?? null]),
    )

    const recipients: MarketingRecipient[] = []
    const perPage = 1000
    let page = 1
    const targetIds = new Set(profileMap.keys())

    while (true) {
      const { data } = await admin.auth.admin.listUsers({ page, perPage })
      const users = data.users ?? []

      for (const authUser of users) {
        if (targetIds.has(authUser.id) && authUser.email) {
          recipients.push({
            userId: authUser.id,
            email: authUser.email,
            fullName: profileMap.get(authUser.id) ?? null,
          })
        }
      }

      if (users.length < perPage) {
        break
      }

      page += 1
    }

    return recipients
  } catch (error) {
    console.error('[marketing] opt-in recipient load error', error)
    return []
  }
}
