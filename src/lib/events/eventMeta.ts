import { cache } from 'react'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { EventPriceTier } from '@/types/EventPriceTier'

export type EventMetaTicket = {
  name: string | null
  final_price_cents: number | null
  currency: string | null
}

export type EventMeta = {
  id: string
  slug: string | null
  title: string
  subtitle?: string | null
  description?: string | null
  date: string
  location: string
  status: string
  image_url?: string | null
  sales_start?: string | null
  tickets?: EventMetaTicket[] | null
  price_tiers?: EventPriceTier[] | null
  [key: string]: unknown
}

const isUUID = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

/**
 * Fetch event metadata (with tickets) by id or slug, for use in
 * `generateMetadata` and the event detail layout render. Wrapped in
 * `React.cache()` so both call sites within the same request share a
 * single Supabase round-trip instead of issuing it twice.
 */
export const fetchEventMeta = cache(async (id: string): Promise<EventMeta | null> => {
  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('events')
    .select(
      `
        *,
        tickets (
          name,
          final_price_cents,
          currency
        ),
        price_tiers:event_price_tiers (*)
      `
    )
    .eq(isUUID(id) ? 'id' : 'slug', id)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('[event meta]', id, error.message)
    return null
  }

  return data as EventMeta
})
