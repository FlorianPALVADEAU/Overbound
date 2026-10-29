import { supabaseAdmin } from '@/lib/supabase/server'
import { resolveAudience, type AudienceSelector } from '@/lib/email/audience'
import type { MarketingRecipient } from '@/lib/email/marketing'

/** An unreadable audience must not look like a full one: log and send to nobody. */
async function resolveAudienceOrEmpty(selector: AudienceSelector): Promise<MarketingRecipient[]> {
  try {
    return await resolveAudience(selector)
  } catch (error) {
    console.error('[subscriptions] audience resolution failed', selector, error)
    return []
  }
}

/**
 * Get recipients subscribed to a specific distribution list
 * @param listSlug - Slug of the distribution list
 */
export async function getListRecipients(listSlug: string): Promise<MarketingRecipient[]> {
  return resolveAudienceOrEmpty({ listSlugs: [listSlug] })
}

/**
 * Get recipients subscribed to multiple distribution lists (union, one entry per address)
 * @param listSlugs - Array of list slugs
 */
export async function getMultipleListsRecipients(listSlugs: string[]): Promise<MarketingRecipient[]> {
  return resolveAudienceOrEmpty({ listSlugs })
}

/**
 * Get recipients subscribed to ALL specified lists (intersection)
 * @param listSlugs - Array of list slugs (user must be subscribed to ALL)
 * @returns Array of recipients subscribed to all lists
 */
export async function getIntersectionListsRecipients(
  listSlugs: string[]
): Promise<MarketingRecipient[]> {
  try {
    const admin = supabaseAdmin()

    // Get the list IDs from slugs
    const { data: lists, error: listsError } = await admin
      .from('distribution_lists')
      .select('id')
      .in('slug', listSlugs)
      .eq('active', true)

    if (listsError || !lists || lists.length !== listSlugs.length) {
      console.error('[subscriptions] lists not found', listSlugs, listsError)
      return []
    }

    const listIds = lists.map((l) => l.id)

    // Get subscriptions for all these lists
    const { data: subscriptions, error: subsError } = await admin
      .from('list_subscriptions')
      .select(
        `
        user_id,
        list_id,
        profiles:user_id (
          id,
          full_name
        )
      `
      )
      .in('list_id', listIds)
      .eq('subscribed', true)

    if (subsError || !subscriptions) {
      console.error('[subscriptions] subscription fetch error', subsError)
      return []
    }

    // Group by user_id and count subscriptions
    const userListCounts = new Map<string, number>()
    const profileMap = new Map<string, string | null>()

    for (const sub of subscriptions) {
      userListCounts.set(sub.user_id, (userListCounts.get(sub.user_id) || 0) + 1)
      if (!profileMap.has(sub.user_id)) {
        profileMap.set(sub.user_id, (sub.profiles as any)?.full_name ?? null)
      }
    }

    // Filter users subscribed to ALL lists
    const qualifiedUserIds = Array.from(userListCounts.entries())
      .filter(([_, count]) => count === listIds.length)
      .map(([userId]) => userId)

    if (qualifiedUserIds.length === 0) {
      return []
    }

    // Fetch emails
    const recipients: MarketingRecipient[] = []
    const batchSize = 100

    for (let i = 0; i < qualifiedUserIds.length; i += batchSize) {
      const batch = qualifiedUserIds.slice(i, i + batchSize)

      for (const userId of batch) {
        try {
          const { data: authUser } = await admin.auth.admin.getUserById(userId)

          if (authUser.user && authUser.user.email) {
            recipients.push({
              userId: authUser.user.id,
              email: authUser.user.email,
              fullName: profileMap.get(authUser.user.id) ?? null,
            })
          }
        } catch (error) {
          console.error(
            `[subscriptions] failed to fetch user ${userId}`,
            error
          )
        }
      }
    }

    return recipients
  } catch (error) {
    console.error(
      '[subscriptions] get intersection lists recipients error',
      error
    )
    return []
  }
}
