import {
  sendNewEventAnnouncementEmail,
  sendPriceChangeReminderEmail,
  sendPromoCampaignEmail,
} from '@/lib/email'
import { getLastEmailLog, recordEmailLog } from '@/lib/email/emailLogs'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  getListRecipients,
  getMultipleListsRecipients,
} from '@/lib/subscriptions/lists'

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
      userId: recipient.userId || undefined,
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
      userId: recipient.userId || undefined,
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
      userId: recipient.userId || undefined,
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

  // Filter recipients based on digest frequency preference
  const filteredRecipients = await filterRecipientsByDigestFrequency(recipients)

  const batches = chunkRecipients(filteredRecipients, DEFAULT_BATCH_SIZE)

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

/**
 * Filter recipients based on their digest frequency preference
 * Only sends immediate emails to users with 'immediate' or default (no preference) setting
 * Users with 'daily', 'weekly', or 'never' preferences are filtered out
 */
async function filterRecipientsByDigestFrequency(
  recipients: MarketingRecipient[]
): Promise<MarketingRecipient[]> {
  if (recipients.length === 0) {
    return []
  }

  // Get user IDs that have recipients
  const userIds = recipients
    .map((r) => r.userId)
    .filter((id): id is string => id !== null && id !== undefined)

  if (userIds.length === 0) {
    // If no user IDs, allow all (backward compatibility)
    return recipients
  }

  try {
    // Query notification preferences for these users
    const { data: preferences, error } = await supabaseAdmin()
      .from('notification_preferences')
      .select('user_id, digest_frequency')
      .in('user_id', userIds)

    if (error) {
      console.error('Error fetching notification preferences:', error)
      // On error, default to sending to all (backward compatibility)
      return recipients
    }

    // Create a map of user_id to digest_frequency
    const preferencesMap = new Map(
      preferences?.map((p) => [p.user_id, p.digest_frequency]) ?? []
    )

    // Filter recipients: only keep those with 'immediate' or no preference set
    return recipients.filter((recipient) => {
      if (!recipient.userId) {
        // No user ID means we can't check preferences, allow it (backward compatibility)
        return true
      }

      const digestFrequency = preferencesMap.get(recipient.userId)

      // Allow if:
      // 1. No preference found (user hasn't set preferences yet, default to immediate)
      // 2. Preference is 'immediate'
      return !digestFrequency || digestFrequency === 'immediate'
    })
  } catch (error) {
    console.error('Error filtering recipients by digest frequency:', error)
    // On error, default to sending to all (backward compatibility)
    return recipients
  }
}

function chunkRecipients(recipients: MarketingRecipient[], size: number) {
  const chunks: MarketingRecipient[][] = []
  for (let i = 0; i < recipients.length; i += size) {
    chunks.push(recipients.slice(i, i + size))
  }
  return chunks
}

/**
 * Get recipients from a specific distribution list
 * @param listSlug - Slug of the distribution list (e.g., 'events-announcements')
 * @returns Array of recipients subscribed to the list
 */
export async function getRecipientsFromList(
  listSlug: string
): Promise<MarketingRecipient[]> {
  return await getListRecipients(listSlug)
}

/**
 * Get recipients from multiple distribution lists (union)
 * @param listSlugs - Array of list slugs
 * @returns Array of unique recipients subscribed to ANY of the lists
 */
export async function getRecipientsFromLists(
  listSlugs: string[]
): Promise<MarketingRecipient[]> {
  return await getMultipleListsRecipients(listSlugs)
}

/**
 * Get recipients for event announcements
 * Uses the 'events-announcements' distribution list
 * @returns Array of recipients subscribed to event announcements
 */
export async function getEventAnnouncementRecipients(): Promise<MarketingRecipient[]> {
  return await getListRecipients('events-announcements')
}

/**
 * Get recipients for price alerts
 * Uses the 'price-alerts' distribution list
 * @returns Array of recipients subscribed to price alerts
 */
export async function getPriceAlertRecipients(): Promise<MarketingRecipient[]> {
  return await getListRecipients('price-alerts')
}

/**
 * Send marketing emails with unsubscribe links
 * This is the main function to use for distribution list emails
 */
export async function sendMarketingEmail(
  emailType: MarketingEmailType,
  recipients: MarketingRecipient[],
  sendFn: (recipient: MarketingRecipient) => Promise<void>,
  context: Record<string, unknown> = {},
) {
  if (!process.env.RESEND_API_KEY) {
    return
  }

  // Filter recipients based on digest frequency preference
  const filteredRecipients = await filterRecipientsByDigestFrequency(recipients)

  const batches = chunkRecipients(filteredRecipients, DEFAULT_BATCH_SIZE)

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

/**
 * DEPRECATED: Use getRecipientsFromLists() instead
 * Kept for backward compatibility - returns recipients with marketing_opt_in = true
 *
 * Migration guide:
 * - For event announcements: use getEventAnnouncementRecipients()
 * - For price changes: use getPriceAlertRecipients()
 * - For general marketing: use getRecipientsFromLists(['events-announcements', 'price-alerts', 'news-blog'])
 */
export async function getMarketingOptInRecipients(): Promise<MarketingRecipient[]> {
  try {
    // Use the new distribution lists system
    // Get recipients from main marketing lists
    return await getMultipleListsRecipients([
      'events-announcements',
      'price-alerts',
      'news-blog',
    ])
  } catch (error) {
    console.error('[marketing] opt-in recipient load error', error)
    return []
  }
}
