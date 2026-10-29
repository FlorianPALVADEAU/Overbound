import {
  sendNewEventAnnouncementEmail,
  sendPriceChangeReminderEmail,
  sendPromoCampaignEmail,
} from '@/lib/email'
import { createHash } from 'node:crypto'
import { runCampaign, type CampaignReport } from '@/lib/email/campaign'
import {
  getMarketingTransportName,
  isMarketingTransportConfigured,
  type SendResult,
} from '@/lib/email/transport'
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

export async function dispatchNewEventAnnouncement(params: {
  recipients: MarketingRecipient[]
  eventTitle: string
  eventDate: string
  eventLocation: string
  eventUrl: string
  highlight?: string | null
}) {
  return dispatchMarketingEmails('marketing_new_event', params.recipients, async (recipient) => {
    return sendNewEventAnnouncementEmail({
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
  return dispatchMarketingEmails('marketing_price_change', params.recipients, async (recipient) => {
    return sendPriceChangeReminderEmail({
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
  return dispatchMarketingEmails('marketing_promo', params.recipients, async (recipient) => {
    return sendPromoCampaignEmail({
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

/** Same mail to the same audience is one campaign: a rerun resumes it instead of mailing twice. */
function campaignKeyFor(emailType: MarketingEmailType, context: Record<string, unknown>) {
  const digest = createHash('sha256').update(JSON.stringify(context)).digest('hex').slice(0, 16)
  return `${emailType}:${digest}`
}

async function dispatchMarketingEmails(
  emailType: MarketingEmailType,
  recipients: MarketingRecipient[],
  sendFn: (recipient: MarketingRecipient) => Promise<SendResult>,
  context: Record<string, unknown> = {},
): Promise<CampaignReport | null> {
  if (!isMarketingTransportConfigured()) {
    console.error(`[marketing] ${getMarketingTransportName()} is not configured, ${emailType} not sent`)
    return null
  }

  const eligible = await filterRecipientsByDigestFrequency(recipients)
  const report = await runCampaign({
    campaignKey: campaignKeyFor(emailType, context),
    provider: getMarketingTransportName(),
    recipients: eligible,
    send: sendFn,
  })

  console.info(`[marketing] ${emailType}`, {
    sent: report.sent,
    failed: report.failed,
    alreadyDone: report.alreadyDone,
    suppressed: report.suppressed,
    remaining: report.remaining,
    aborted: report.aborted,
  })
  return report
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
    // Nobody to look up: recipients without an account have no preference to honour
    return recipients
  }

  // Query notification preferences for these users
  const { data: preferences, error } = await supabaseAdmin()
    .from('notification_preferences')
    .select('user_id, digest_frequency')
    .in('user_id', userIds)

  if (error) {
    // Fail closed: an unreadable preference table must not turn into "mail everyone".
    throw new Error(`[marketing] preference read failed: ${error.message}`)
  }

  const preferencesMap = new Map(preferences?.map((p) => [p.user_id, p.digest_frequency]) ?? [])

  // Keep recipients with 'immediate' or no preference set; recipients without an account have none.
  return recipients.filter((recipient) => {
    if (!recipient.userId) return true
    const digestFrequency = preferencesMap.get(recipient.userId)
    return !digestFrequency || digestFrequency === 'immediate'
  })
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
