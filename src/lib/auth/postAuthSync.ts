import type { User } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/server'
import { syncProviderAvatar } from '@/lib/account/avatarStorage'
import { profileNameFromUserMetadata } from '@/lib/account/profile'
import {
  DEFAULT_MARKETING_LIST_SLUGS,
  mapSlugsToAudienceIds,
  subscribeResendContactToAudiences,
} from '@/lib/email/resendAudiences'

type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  marketing_opt_in: boolean | null
}

type EmailSubscriptionRow = {
  id: string
  list_id: string
  subscribed: boolean | null
  subscribed_at: string | null
  first_name: string | null
  last_name: string | null
}

type UserSubscriptionRow = {
  id: string
  list_id: string
  subscribed: boolean | null
  subscribed_at: string | null
}

type MarketingSubscriptionRow = {
  subscribed: boolean | null
  distribution_lists:
    | {
        type: string | null
      }
    | Array<{
        type: string | null
      }>
    | null
}

const MARKETING_LIST_TYPES = new Set(['marketing', 'events', 'news'])

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const normalizeName = (value: string | null | undefined) => {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const throwIfError = (error: { message?: string } | null) => {
  if (error) {
    throw error
  }
}

async function ensureProfile(user: User): Promise<ProfileRow | null> {
  const admin = supabaseAdmin()
  const names = profileNameFromUserMetadata(user.user_metadata)

  const { data: existingProfile, error: fetchError } = await admin
    .from('profiles')
    .select('id, first_name, last_name, marketing_opt_in')
    .eq('id', user.id)
    .maybeSingle()

  if (fetchError) {
    throw fetchError
  }

  if (!existingProfile) {
    const insertPayload: Record<string, string | boolean | null> = {
      id: user.id,
      first_name: names.first_name ?? null,
      last_name: names.last_name ?? null,
      marketing_opt_in: false,
    }

    const { data: insertedProfile, error: insertError } = await admin
      .from('profiles')
      .insert(insertPayload)
      .select('id, first_name, last_name, marketing_opt_in')
      .single()

    if (insertError) {
      throw insertError
    }

    return insertedProfile as ProfileRow
  }

  // Un champ vide du profil se complète avec celui de l'inscription, un champ déjà rempli n'est jamais écrasé.
  const missingNames: Record<string, string> = {}
  if (!existingProfile.first_name && names.first_name) missingNames.first_name = names.first_name
  if (!existingProfile.last_name && names.last_name) missingNames.last_name = names.last_name

  if (Object.keys(missingNames).length > 0) {
    const { data: updatedProfile, error: updateError } = await admin
      .from('profiles')
      .update(missingNames)
      .eq('id', user.id)
      .select('id, first_name, last_name, marketing_opt_in')
      .single()

    if (updateError) {
      throw updateError
    }

    return updatedProfile as ProfileRow
  }

  return existingProfile as ProfileRow
}

async function linkEmailSubscriptionsToUser(user: User, profile: ProfileRow | null) {
  if (!user.email) {
    return
  }

  const admin = supabaseAdmin()
  const email = normalizeEmail(user.email)

  const { data: emailSubscriptions, error: emailSubscriptionsError } = await admin
    .from('list_subscriptions')
    .select('id, list_id, subscribed, subscribed_at, first_name, last_name')
    .is('user_id', null)
    .ilike('email', email)

  if (emailSubscriptionsError) {
    throw emailSubscriptionsError
  }

  const rows = (emailSubscriptions ?? []) as EmailSubscriptionRow[]
  if (rows.length === 0) {
    return
  }

  if (!profile?.first_name || !profile?.last_name) {
    const fallback = {
      first_name: rows.map((row) => normalizeName(row.first_name)).find(Boolean) ?? null,
      last_name: rows.map((row) => normalizeName(row.last_name)).find(Boolean) ?? null,
    }
    const missing: Record<string, string> = {}
    if (!profile?.first_name && fallback.first_name) missing.first_name = fallback.first_name
    if (!profile?.last_name && fallback.last_name) missing.last_name = fallback.last_name
    if (Object.keys(missing).length > 0) {
      const { error: updateNameError } = await admin.from('profiles').update(missing).eq('id', user.id)
      throwIfError(updateNameError)
    }
  }

  const listIds = Array.from(new Set(rows.map((row) => row.list_id)))
  const { data: existingUserSubscriptions, error: existingUserSubscriptionsError } = await admin
    .from('list_subscriptions')
    .select('id, list_id, subscribed, subscribed_at')
    .eq('user_id', user.id)
    .in('list_id', listIds)

  if (existingUserSubscriptionsError) {
    throw existingUserSubscriptionsError
  }

  const existingMap = new Map<string, UserSubscriptionRow>()
  ;((existingUserSubscriptions ?? []) as UserSubscriptionRow[]).forEach((row) => {
    if (!existingMap.has(row.list_id)) {
      existingMap.set(row.list_id, row)
    }
  })

  for (const row of rows) {
    const existing = existingMap.get(row.list_id)

    if (existing) {
      const nextSubscribed = Boolean(existing.subscribed) || Boolean(row.subscribed)
      const nextSubscribedAt = existing.subscribed_at ?? row.subscribed_at ?? null

      if (nextSubscribed !== Boolean(existing.subscribed) || nextSubscribedAt !== existing.subscribed_at) {
        const updatePayload: Record<string, string | boolean | null> = {
          subscribed: nextSubscribed,
          subscribed_at: nextSubscribedAt,
          unsubscribed_at: nextSubscribed ? null : new Date().toISOString(),
        }

        const { error: mergeError } = await admin
          .from('list_subscriptions')
          .update(updatePayload)
          .eq('id', existing.id)
        throwIfError(mergeError)
      }

      const { error: deleteError } = await admin.from('list_subscriptions').delete().eq('id', row.id)
      throwIfError(deleteError)
      continue
    }

    const { error: attachError } = await admin
      .from('list_subscriptions')
      .update({
        user_id: user.id,
        email: null,
        first_name: null,
        last_name: null,
      })
      .eq('id', row.id)
    throwIfError(attachError)
  }

  const { data: marketingSubscriptions, error: marketingSubscriptionsError } = await admin
    .from('list_subscriptions')
    .select(
      `
      subscribed,
      distribution_lists!inner(type)
    `,
    )
    .eq('user_id', user.id)
    .eq('subscribed', true)

  if (marketingSubscriptionsError) {
    throw marketingSubscriptionsError
  }

  const hasMarketingSubscription = ((marketingSubscriptions ?? []) as MarketingSubscriptionRow[]).some(
    (row) => {
      const list = Array.isArray(row.distribution_lists)
        ? row.distribution_lists[0]
        : row.distribution_lists
      return MARKETING_LIST_TYPES.has(String(list?.type ?? '').toLowerCase())
    },
  )

  if (profile?.marketing_opt_in !== hasMarketingSubscription) {
    const { error: marketingSyncError } = await admin
      .from('profiles')
      .update({ marketing_opt_in: hasMarketingSubscription })
      .eq('id', user.id)
    throwIfError(marketingSyncError)
  }
}

export async function runPostAuthSync(user: User) {
  const profile = await ensureProfile(user)
  await linkEmailSubscriptionsToUser(user, profile)
  await syncProviderAvatar(supabaseAdmin(), user.id, user.user_metadata)

  // Keep Resend in sync for every authenticated account so account emails are always present.
  if (user.email) {
    const { audienceIds } = mapSlugsToAudienceIds([...DEFAULT_MARKETING_LIST_SLUGS])
    if (audienceIds.length > 0) {
      const names = profile ?? profileNameFromUserMetadata(user.user_metadata)
      try {
        await subscribeResendContactToAudiences({
          email: user.email,
          firstName: names.first_name,
          lastName: names.last_name,
          audienceIds,
          properties: {
            user_id: user.id,
            source: 'post_auth_sync',
          },
        })
      } catch (error) {
        console.error('[post-auth-sync] resend sync failed', error)
      }
    }
  }
}
