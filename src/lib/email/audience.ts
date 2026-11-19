import { supabaseAdmin } from '@/lib/supabase/server'
import type { MarketingRecipient } from '@/lib/email/marketing'
import { filterSuppressed } from '@/lib/email/suppression'
import { hasProvenConsent } from '@/lib/email/consent'
import { loadSegmentIdentity } from '@/lib/email/segmentStore'

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
  firstName: string | null
  lastName: string | null
  subscribed: boolean
  source: string | null
  subscribedAt: string | null
  unsubscribedAt?: string | null
}

type ProfileName = { first_name: string | null; last_name: string | null }

interface SubscriptionRow {
  id: string
  list_id: string
  user_id: string | null
  email: string | null
  first_name: string | null
  last_name: string | null
  subscribed: boolean | null
  source: string | null
  subscribed_at: string | null
  unsubscribed_at: string | null
}

// No `profiles` embed: list_subscriptions.user_id references auth.users, not profiles, so PostgREST
// finds no relationship to embed. Names are read from profiles separately (fetchProfileNames).
const SUBSCRIPTION_COLUMNS =
  'id, list_id, user_id, email, first_name, last_name, subscribed, source, subscribed_at, unsubscribed_at'

const normalizeEmail = (value: string | null | undefined) => value?.trim().toLowerCase() ?? ''

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

/** Ids of the active lists matching the selector; no selector means every active list. */
async function resolveActiveListIds(selector: AudienceSelector, options: { includeInactive?: boolean } = {}): Promise<string[]> {
  let query = supabaseAdmin().from('distribution_lists').select('id')
  if (!options.includeInactive) query = query.eq('active', true)
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

/** Names of the accounts; the account wins over the anonymous subscription row, field by field. */
async function fetchProfileNames(userIds: Set<string>): Promise<Map<string, ProfileName>> {
  const names = new Map<string, ProfileName>()

  for (const ids of chunk(Array.from(userIds), LOOKUP_CHUNK_SIZE)) {
    const { data, error } = await supabaseAdmin().from('profiles').select('id, first_name, last_name').in('id', ids)
    if (error) {
      throw new Error(`[audience] profile read failed: ${error.message}`)
    }
    for (const row of (data ?? []) as Array<ProfileName & { id: string }>) {
      names.set(row.id, { first_name: row.first_name, last_name: row.last_name })
    }
  }
  return names
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
  const profileNames = await fetchProfileNames(userIds)

  const subscribers: ListSubscriber[] = []
  for (const row of rows) {
    const email = normalizeEmail((row.user_id ? authEmails.get(row.user_id) : null) ?? row.email)
    if (!email) continue

    const profile = row.user_id ? profileNames.get(row.user_id) : undefined
    subscribers.push({
      id: row.id,
      listId: row.list_id,
      userId: row.user_id,
      email,
      firstName: profile?.first_name ?? row.first_name ?? null,
      lastName: profile?.last_name ?? row.last_name ?? null,
      subscribed: Boolean(row.subscribed),
      source: row.source,
      subscribedAt: row.subscribed_at,
      unsubscribedAt: row.unsubscribed_at ?? null,
    })
  }
  return subscribers
}

type Candidate = Pick<ListSubscriber, 'userId' | 'email' | 'firstName'>

/** One recipient per address; keeps the entry that knows the account and the name. */
function dedupeByEmail(subscribers: Candidate[]): MarketingRecipient[] {
  const byEmail = new Map<string, MarketingRecipient>()

  for (const subscriber of subscribers) {
    if (!EMAIL_PATTERN.test(subscriber.email)) continue

    const existing = byEmail.get(subscriber.email)
    if (!existing) {
      byEmail.set(subscriber.email, {
        userId: subscriber.userId,
        email: subscriber.email,
        firstName: subscriber.firstName,
      })
      continue
    }
    existing.userId = existing.userId ?? subscriber.userId
    existing.firstName = existing.firstName ?? subscriber.firstName
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
 * A person who turned a list off themselves: unsubscribe link, preferences page or admin. A row that
 * was never subscribed (account default, no date at all) is not a choice and does not count.
 */
const isExplicitOptOut = (subscriber: ListSubscriber) =>
  !subscriber.subscribed && Boolean(subscriber.unsubscribedAt ?? subscriber.subscribedAt)

/**
 * Buyers (owner decision 2026-11-19): anyone with a non-cancelled registration receives marketing,
 * whatever the lists say, unless they opted out of a list themselves. Accounts keep their user id so
 * the digest opt-out still applies downstream.
 */
async function resolveBuyers(optedOut: Set<string>): Promise<Candidate[]> {
  const identity = await loadSegmentIdentity('registered')
  const accountEmails = await fetchAuthEmails(new Set(identity.userIds))

  const byEmail = new Map<string, Candidate>()
  for (const [userId, rawEmail] of accountEmails) {
    byEmail.set(normalizeEmail(rawEmail), { userId, email: normalizeEmail(rawEmail), firstName: null })
  }
  for (const email of identity.emails) {
    if (!byEmail.has(email)) byEmail.set(email, { userId: null, email, firstName: null })
  }
  return Array.from(byEmail.values()).filter((buyer) => !optedOut.has(buyer.email))
}

/**
 * Who may receive a marketing mail for the selected lists (all active lists when none is given):
 * subscribed accounts and email-only subscribers whose consent can be traced to a source, plus every
 * buyer, one entry per address, minus explicit list opt-outs, digest opt-outs and addresses
 * suppressed after a bounce or complaint. Throws rather than widening the audience.
 */
export async function resolveAudience(selector: AudienceSelector = {}): Promise<MarketingRecipient[]> {
  const listIds = await resolveActiveListIds(selector)
  const subscribers = await listSubscribers(listIds, { subscribedOnly: true })
  const proven = subscribers.filter((subscriber) => hasProvenConsent(subscriber.source))

  // An opt-out from a list that was retired since still counts: the person said no.
  const allListIds = await resolveActiveListIds({}, { includeInactive: true })
  const everyRow = await listSubscribers(allListIds, { subscribedOnly: false })
  const optedOut = new Set(everyRow.filter(isExplicitOptOut).map((row) => row.email))
  const buyers = await resolveBuyers(optedOut)

  const withDigestPreference = await dropNonImmediateDigest(dedupeByEmail([...proven, ...buyers]))
  return filterSuppressed(withDigestPreference)
}

/**
 * Addresses still subscribed on a row we cannot trace to a consent: the audience of the
 * re-consent mail. Once a person answers, their rows are either confirmed (traced source) or
 * unsubscribed, so a second run only reaches those who did not answer.
 */
export async function resolveReconsentAudience(): Promise<MarketingRecipient[]> {
  const listIds = await resolveActiveListIds({})
  const subscribers = await listSubscribers(listIds, { subscribedOnly: true })
  const unproven = subscribers.filter((subscriber) => !hasProvenConsent(subscriber.source))
  const withDigestPreference = await dropNonImmediateDigest(dedupeByEmail(unproven))
  return filterSuppressed(withDigestPreference)
}
