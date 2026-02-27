import type { User } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/server'

type ProfileRow = {
  id: string
  full_name: string | null
  marketing_opt_in: boolean | null
}

type EmailSubscriptionRow = {
  id: string
  list_id: string
  subscribed: boolean | null
  subscribed_at: string | null
  full_name: string | null
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

const resolveUserName = (user: User) =>
  normalizeName(
    (user.user_metadata as Record<string, unknown> | undefined)?.full_name as string | undefined,
  )

const throwIfError = (error: { message?: string } | null) => {
  if (error) {
    throw error
  }
}

async function ensureProfile(user: User): Promise<ProfileRow | null> {
  const admin = supabaseAdmin()
  const userName = resolveUserName(user)

  const { data: existingProfile, error: fetchError } = await admin
    .from('profiles')
    .select('id, full_name, marketing_opt_in')
    .eq('id', user.id)
    .maybeSingle()

  if (fetchError) {
    throw fetchError
  }

  if (!existingProfile) {
    const insertPayload: Record<string, string | boolean | null> = {
      id: user.id,
      full_name: userName,
      marketing_opt_in: false,
    }

    const { data: insertedProfile, error: insertError } = await admin
      .from('profiles')
      .insert(insertPayload)
      .select('id, full_name, marketing_opt_in')
      .single()

    if (insertError) {
      throw insertError
    }

    return insertedProfile as ProfileRow
  }

  if (!existingProfile.full_name && userName) {
    const { data: updatedProfile, error: updateError } = await admin
      .from('profiles')
      .update({ full_name: userName })
      .eq('id', user.id)
      .select('id, full_name, marketing_opt_in')
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
    .select('id, list_id, subscribed, subscribed_at, full_name')
    .is('user_id', null)
    .ilike('email', email)

  if (emailSubscriptionsError) {
    throw emailSubscriptionsError
  }

  const rows = (emailSubscriptions ?? []) as EmailSubscriptionRow[]
  if (rows.length === 0) {
    return
  }

  if (!profile?.full_name) {
    const fallbackName = rows.map((row) => normalizeName(row.full_name)).find(Boolean) ?? null
    if (fallbackName) {
      const { error: updateNameError } = await admin
        .from('profiles')
        .update({ full_name: fallbackName })
        .eq('id', user.id)
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
        full_name: null,
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
}
