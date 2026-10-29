import { supabaseAdmin } from '@/lib/supabase/server'
import type { MarketingRecipient } from '@/lib/email/marketing'
import { filterSuppressed } from '@/lib/email/suppression'

/**
 * Marketing audience, read from Supabase only (FDR-0007: Supabase is the source of truth,
 * the mail provider is never asked who is subscribed).
 */

const SUBSCRIPTIONS_PAGE_SIZE = 1000
const AUTH_USERS_PAGE_SIZE = 1000
const LOOKUP_CHUNK_SIZE = 200
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface AudienceSelector {
  listIds?: string[]
  listSlugs?: string[]
}

export interface ListSubscriber {
  id: string
  listId: string
  userId: string | null
  email: string
  fullName: string | null
  subscribed: boolean
  source: string | null
  subscribedAt: string | null
}

type ProfileName = { full_name: string | null }

interface SubscriptionRow {
  id: string
  list_id: string
  user_id: string | null
  email: string | null
  full_name: string | null
  subscribed: boolean | null
  source: string | null
  subscribed_at: string | null
  profiles: ProfileName | ProfileName[] | null
}

const SUBSCRIPTION_COLUMNS =
  'id, list_id, user_id, email, full_name, subscribed, source, subscribed_at, profiles:user_id(full_name)'

const normalizeEmail = (value: string | null | undefined) => value?.trim().toLowerCase() ?? ''

const profileName = (profiles: SubscriptionRow['profiles']) =>
  (Array.isArray(profiles) ? profiles[0]?.full_name : profiles?.full_name) ?? null

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

/** Ids of the active lists matching the selector; no selector means every active list. */
async function resolveActiveListIds(selector: AudienceSelector): Promise<string[]> {
  let query = supabaseAdmin().from('distribution_lists').select('id').eq('active', true)
  if (selector.listIds) query = query.in('id', selector.listIds)
  if (selector.listSlugs) query = query.in('slug', selector.listSlugs)

  const { data, error } = await query
  if (error) {
    throw new Error(`[audience] list lookup failed: ${error.message}`)
  }
  return (data ?? []).map((row: { id: string }) => row.id)
}

async function fetchSubscriptionRows(listIds: string[], subscribedOnly: boolean): Promise<SubscriptionRow[]> {
  const admin = supabaseAdmin()
  const rows: SubscriptionRow[] = []

  for (let from = 0; ; from += SUBSCRIPTIONS_PAGE_SIZE) {
    let query = admin.from('list_subscriptions').select(SUBSCRIPTION_COLUMNS).in('list_id', listIds)
    if (subscribedOnly) query = query.eq('subscribed', true)

    const { data, error } = await query.order('id').range(from, from + SUBSCRIPTIONS_PAGE_SIZE - 1)
    if (error) {
      throw new Error(`[audience] subscription read failed: ${error.message}`)
    }

    const page = (data ?? []) as SubscriptionRow[]
    rows.push(...page)
    if (page.length < SUBSCRIPTIONS_PAGE_SIZE) {
      return rows
    }
  }
}

/** `profiles` carries no email, so account addresses come from auth.users. */
async function fetchAuthEmails(userIds: Set<string>): Promise<Map<string, string>> {
  const emails = new Map<string, string>()
  if (userIds.size === 0) return emails

  const admin = supabaseAdmin()
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: AUTH_USERS_PAGE_SIZE })
    if (error) {
      throw new Error(`[audience] auth user read failed: ${error.message}`)
    }

    const users = data.users ?? []
    for (const user of users) {
      if (userIds.has(user.id) && user.email) {
        emails.set(user.id, user.email)
      }
    }
    if (users.length < AUTH_USERS_PAGE_SIZE || emails.size >= userIds.size) {
      return emails
    }
  }
}

/** Every subscription row of the given lists with its address resolved, rows without an address dropped. */
export async function listSubscribers(
  listIds: string[],
  options: { subscribedOnly: boolean },
): Promise<ListSubscriber[]> {
  if (listIds.length === 0) return []

  const rows = await fetchSubscriptionRows(listIds, options.subscribedOnly)
  const userIds = new Set(rows.flatMap((row) => (row.user_id ? [row.user_id] : [])))
  const authEmails = await fetchAuthEmails(userIds)

  const subscribers: ListSubscriber[] = []
  for (const row of rows) {
    const email = normalizeEmail((row.user_id ? authEmails.get(row.user_id) : null) ?? row.email)
    if (!email) continue

    subscribers.push({
      id: row.id,
      listId: row.list_id,
      userId: row.user_id,
      email,
      fullName: profileName(row.profiles) ?? row.full_name ?? null,
      subscribed: Boolean(row.subscribed),
      source: row.source,
      subscribedAt: row.subscribed_at,
    })
  }
  return subscribers
}

/** One recipient per address; keeps the entry that knows the account and the name. */
function dedupeByEmail(subscribers: ListSubscriber[]): MarketingRecipient[] {
  const byEmail = new Map<string, MarketingRecipient>()

  for (const subscriber of subscribers) {
    if (!EMAIL_PATTERN.test(subscriber.email)) continue

    const existing = byEmail.get(subscriber.email)
    if (!existing) {
      byEmail.set(subscriber.email, {
        userId: subscriber.userId,
        email: subscriber.email,
        fullName: subscriber.fullName,
      })
      continue
    }
    existing.userId = existing.userId ?? subscriber.userId
    existing.fullName = existing.fullName ?? subscriber.fullName
  }
  return Array.from(byEmail.values())
}

/** Drops accounts that asked for a digest or for no mail; fails closed when preferences cannot be read. */
async function dropNonImmediateDigest(recipients: MarketingRecipient[]): Promise<MarketingRecipient[]> {
  const userIds = recipients.flatMap((recipient) => (recipient.userId ? [recipient.userId] : []))
  const excluded = new Set<string>()

  for (const ids of chunk(userIds, LOOKUP_CHUNK_SIZE)) {
    const { data, error } = await supabaseAdmin()
      .from('notification_preferences')
      .select('user_id, digest_frequency')
      .in('user_id', ids)
    if (error) {
      throw new Error(`[audience] preference read failed: ${error.message}`)
    }
    for (const row of (data ?? []) as Array<{ user_id: string; digest_frequency: string | null }>) {
      if (row.digest_frequency && row.digest_frequency !== 'immediate') {
        excluded.add(row.user_id)
      }
    }
  }

  return recipients.filter((recipient) => !recipient.userId || !excluded.has(recipient.userId))
}

/**
 * Who may receive a marketing mail for the selected lists (all active lists when none is given):
 * subscribed accounts and email-only subscribers, one entry per address, minus digest opt-outs
 * and minus addresses suppressed after a bounce or complaint. Throws rather than widening the audience.
 */
export async function resolveAudience(selector: AudienceSelector = {}): Promise<MarketingRecipient[]> {
  const listIds = await resolveActiveListIds(selector)
  const subscribers = await listSubscribers(listIds, { subscribedOnly: true })
  const withDigestPreference = await dropNonImmediateDigest(dedupeByEmail(subscribers))
  return filterSuppressed(withDigestPreference)
}
