import type { SupabaseClient } from '@supabase/supabase-js'
import { selectFeaturedEvent } from '@/lib/events/featuredEvent'
import { getEffectiveEventStatus } from '@/lib/events/registrationStatus'

type Admin = Pick<SupabaseClient, 'from'>

/**
 * Slug of the event visitors should land on: the one open for sales, else the next announced one.
 * Null when there is none (or when the read fails: a missing link must never break a page or an email).
 */
export async function loadOpenEventSlug(admin: Admin): Promise<string | null> {
  const { data, error } = await admin.from('events').select('slug, status, sales_start, date')
  if (error || !data) return null
  const events = data.map((event) => ({ ...event, status: getEffectiveEventStatus(event) }))
  return selectFeaturedEvent(events)?.slug ?? null
}
