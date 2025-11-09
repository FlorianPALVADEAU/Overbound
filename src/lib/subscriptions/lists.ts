import { supabaseAdmin } from '@/lib/supabase/server'
import type { MarketingRecipient } from '@/lib/email/marketing'

/**
 * Get recipients subscribed to a specific distribution list
 * @param listSlug - Slug of the distribution list
 * @returns Array of recipients with email, userId, and fullName
 */
export async function getListRecipients(
  listSlug: string
): Promise<MarketingRecipient[]> {
  try {
    const admin = supabaseAdmin()

    // Get the list ID from slug
    const { data: list, error: listError } = await admin
      .from('distribution_lists')
      .select('id')
      .eq('slug', listSlug)
      .eq('active', true)
      .single()

    if (listError || !list) {
      console.error('[subscriptions] list not found', listSlug, listError)
      return []
    }

    // Get all subscribed users for this list
    const { data: subscriptions, error: subsError } = await admin
      .from('list_subscriptions')
      .select(
        `
        user_id,
        profiles:user_id (
          id,
          full_name
        )
      `
      )
      .eq('list_id', list.id)
      .eq('subscribed', true)

    if (subsError) {
      console.error('[subscriptions] subscription fetch error', subsError)
      return []
    }

    if (!subscriptions || subscriptions.length === 0) {
      return []
    }

    // Extract user IDs
    const userIds = subscriptions.map((sub) => sub.user_id)
    const profileMap = new Map(
      subscriptions.map((sub) => [
        sub.user_id,
        (sub.profiles as any)?.full_name ?? null,
      ])
    )

    // Fetch emails from auth.users (requires admin)
    const recipients: MarketingRecipient[] = []

    // Process in batches to avoid overwhelming the API
    const batchSize = 100
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize)

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
          // Continue with other users
        }
      }
    }

    return recipients
  } catch (error) {
    console.error('[subscriptions] get list recipients error', error)
    return []
  }
}

/**
 * Get recipients subscribed to multiple distribution lists (union)
 * @param listSlugs - Array of list slugs
 * @returns Array of unique recipients
 */
export async function getMultipleListsRecipients(
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

    if (listsError || !lists || lists.length === 0) {
      console.error('[subscriptions] lists not found', listSlugs, listsError)
      return []
    }

    const listIds = lists.map((l) => l.id)

    // Get all subscribed users for these lists (deduplicated by user_id)
    const { data: subscriptions, error: subsError } = await admin
      .from('list_subscriptions')
      .select(
        `
        user_id,
        profiles:user_id (
          id,
          full_name
        )
      `
      )
      .in('list_id', listIds)
      .eq('subscribed', true)

    if (subsError) {
      console.error('[subscriptions] subscription fetch error', subsError)
      return []
    }

    if (!subscriptions || subscriptions.length === 0) {
      return []
    }

    // Deduplicate by user_id
    const uniqueUserIds = [...new Set(subscriptions.map((sub) => sub.user_id))]
    const profileMap = new Map(
      subscriptions.map((sub) => [
        sub.user_id,
        (sub.profiles as any)?.full_name ?? null,
      ])
    )

    // Fetch emails from auth.users
    const recipients: MarketingRecipient[] = []
    const batchSize = 100

    for (let i = 0; i < uniqueUserIds.length; i += batchSize) {
      const batch = uniqueUserIds.slice(i, i + batchSize)

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
    console.error('[subscriptions] get multiple lists recipients error', error)
    return []
  }
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
