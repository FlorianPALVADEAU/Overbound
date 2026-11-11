import { supabaseAdmin } from '@/lib/supabase/server'
import { RECONSENT_SOURCE } from '@/lib/email/consent'
import {
  buildConsentView,
  LIST_SLUG_TO_PREFERENCE,
  planConsentUpdate,
  type ConsentChoice,
  type ConsentList,
  type ConsentRow,
} from '@/lib/email/reconsent'

/** Who is answering: an account, or an address that only subscribed through a form. */
export interface ConsentIdentity {
  email: string
  userId?: string
}

async function loadActiveLists(): Promise<ConsentList[]> {
  const { data, error } = await supabaseAdmin()
    .from('distribution_lists')
    .select('id, slug, name, description')
    .eq('active', true)
    .order('name')
  if (error) throw new Error(`[reconsent] list read failed: ${error.message}`)
  return (data ?? []) as ConsentList[]
}

async function loadRows(identity: ConsentIdentity, listIds: string[]): Promise<ConsentRow[]> {
  if (listIds.length === 0) return []

  let query = supabaseAdmin()
    .from('list_subscriptions')
    .select('id, list_id, subscribed, source')
    .in('list_id', listIds)
  query = identity.userId
    ? query.eq('user_id', identity.userId)
    : query.is('user_id', null).eq('email', identity.email)

  const { data, error } = await query
  if (error) throw new Error(`[reconsent] subscription read failed: ${error.message}`)
  return (data ?? []) as ConsentRow[]
}

/** Keeps notification_preferences and list_subscriptions in step: never one without the other. */
async function syncPreferences(userId: string, lists: ConsentList[], chosen: Set<string>) {
  const flags: Record<string, boolean> = {}
  for (const list of lists) {
    const key = LIST_SLUG_TO_PREFERENCE[list.slug]
    if (key) flags[key] = chosen.has(list.id)
  }
  if (Object.keys(flags).length === 0) return

  const { error } = await supabaseAdmin()
    .from('notification_preferences')
    .upsert({ user_id: userId, ...flags }, { onConflict: 'user_id' })
  if (error) throw new Error(`[reconsent] preference write failed: ${error.message}`)
}

const CONFIRMED_PAGE_SIZE = 1000

/** People who confirmed at least one list from the re-consent mail (accounts and form-only addresses). */
export async function countConfirmedPeople(): Promise<number> {
  const admin = supabaseAdmin()
  const people = new Set<string>()

  for (let from = 0; ; from += CONFIRMED_PAGE_SIZE) {
    const { data, error } = await admin
      .from('list_subscriptions')
      .select('user_id, email')
      .eq('source', RECONSENT_SOURCE)
      .eq('subscribed', true)
      .order('id')
      .range(from, from + CONFIRMED_PAGE_SIZE - 1)
    if (error) throw new Error(`[reconsent] confirmed count failed: ${error.message}`)

    const rows = (data ?? []) as Array<{ user_id: string | null; email: string | null }>
    for (const row of rows) {
      const key = row.user_id ?? row.email?.trim().toLowerCase()
      if (key) people.add(key)
    }
    if (rows.length < CONFIRMED_PAGE_SIZE) return people.size
  }
}

export async function loadConsentChoices(identity: ConsentIdentity): Promise<ConsentChoice[]> {
  const lists = await loadActiveLists()
  const rows = await loadRows(identity, lists.map((list) => list.id))
  return buildConsentView(lists, rows)
}

/** Writes the person's answer so the stored state equals it. Returns how many lists they accepted. */
export async function applyConsentChoices(
  identity: ConsentIdentity,
  chosenListIds: string[],
): Promise<{ accepted: number }> {
  const lists = await loadActiveLists()
  const activeIds = new Set(lists.map((list) => list.id))
  const chosen = new Set(chosenListIds.filter((id) => activeIds.has(id)))

  if (identity.userId) {
    await syncPreferences(identity.userId, lists, chosen)
  }

  const rows = await loadRows(identity, lists.map((list) => list.id))
  const plan = planConsentUpdate(lists, rows, [...chosen], new Date().toISOString())
  const admin = supabaseAdmin()

  for (const update of plan.updates) {
    const { error } = await admin.from('list_subscriptions').update(update.patch).eq('id', update.id)
    if (error) throw new Error(`[reconsent] subscription update failed: ${error.message}`)
  }

  if (plan.inserts.length > 0) {
    const { error } = await admin.from('list_subscriptions').insert(
      plan.inserts.map((insert) => ({
        ...insert,
        user_id: identity.userId ?? null,
        email: identity.userId ? null : identity.email,
      })),
    )
    if (error) throw new Error(`[reconsent] subscription insert failed: ${error.message}`)
  }

  return { accepted: chosen.size }
}
