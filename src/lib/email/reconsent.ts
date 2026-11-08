import { hasProvenConsent, RECONSENT_SOURCE } from '@/lib/email/consent'

/**
 * Re-consent: a person confirms, list by list, what they accept to receive.
 * Pure planning only; reading and writing rows lives in reconsentStore.ts.
 */

export interface ConsentList {
  id: string
  slug: string
  name: string
  description: string | null
}

export interface ConsentRow {
  id: string
  list_id: string
  subscribed: boolean | null
  source: string | null
}

export interface ConsentChoice {
  id: string
  name: string
  description: string | null
  /** True only when the subscription is subscribed and its consent is traced. */
  checked: boolean
}

export interface ConsentRowUpdate {
  id: string
  patch: {
    subscribed: boolean
    source?: string
    subscribed_at?: string
    unsubscribed_at: string | null
  }
}

export interface ConsentRowInsert {
  list_id: string
  subscribed: true
  source: string
  subscribed_at: string
}

export interface ConsentPlan {
  updates: ConsentRowUpdate[]
  inserts: ConsentRowInsert[]
}

/** Notification preference behind each list; kept in step with sync_notification_prefs_to_lists. */
export const LIST_SLUG_TO_PREFERENCE: Record<string, string> = {
  'events-announcements': 'events_announcements',
  'price-alerts': 'price_alerts',
  'news-blog': 'news_blog',
  'volunteers-recruitment': 'volunteers_opportunities',
  'partners-offers': 'partner_offers',
}

const rowsByList = (rows: readonly ConsentRow[]) => {
  const byList = new Map<string, ConsentRow>()
  for (const row of rows) {
    const existing = byList.get(row.list_id)
    if (!existing || (!existing.subscribed && row.subscribed)) byList.set(row.list_id, row)
  }
  return byList
}

/** What the page shows: nothing is pre-checked unless the consent is traced. */
export function buildConsentView(lists: readonly ConsentList[], rows: readonly ConsentRow[]): ConsentChoice[] {
  const byList = rowsByList(rows)
  return lists.map((list) => {
    const row = byList.get(list.id)
    return {
      id: list.id,
      name: list.name,
      description: list.description,
      checked: Boolean(row?.subscribed) && hasProvenConsent(row?.source),
    }
  })
}

/**
 * Rows to write so the stored state equals the person's answer.
 * A traced subscription they keep is left untouched, so its original proof survives.
 * Ids that are not active lists are ignored.
 */
export function planConsentUpdate(
  lists: readonly ConsentList[],
  rows: readonly ConsentRow[],
  chosenListIds: readonly string[],
  nowIso: string,
): ConsentPlan {
  const chosen = new Set(chosenListIds)
  const byList = rowsByList(rows)
  const plan: ConsentPlan = { updates: [], inserts: [] }

  for (const list of lists) {
    const row = byList.get(list.id)

    if (chosen.has(list.id)) {
      if (!row) {
        plan.inserts.push({ list_id: list.id, subscribed: true, source: RECONSENT_SOURCE, subscribed_at: nowIso })
      } else if (!(row.subscribed && hasProvenConsent(row.source))) {
        plan.updates.push({
          id: row.id,
          patch: { subscribed: true, source: RECONSENT_SOURCE, subscribed_at: nowIso, unsubscribed_at: null },
        })
      }
      continue
    }

    if (row?.subscribed) {
      plan.updates.push({ id: row.id, patch: { subscribed: false, unsubscribed_at: nowIso } })
    }
  }

  return plan
}
