import { supabaseAdmin } from '@/lib/supabase/server'
import { selectFeaturedEvent } from '@/lib/events/featuredEvent'
import { getEffectiveEventStatus } from '@/lib/events/registrationStatus'
import type { FeaturedEventResponse } from '@/app/api/events/featured/featuredEventQueries'

/**
 * Server-side read of the featured event with its tickets, price tiers and
 * remaining spots. Shared by `/api/events/featured` and the homepage, which
 * renders it into the HTML instead of waiting for a client fetch. Public
 * data only: drafts are never selected. Throws on a database error.
 */
export async function loadFeaturedEvent(): Promise<FeaturedEventResponse> {
  const supabase = supabaseAdmin()

  const { data, error } = await supabase
    .from('events')
    .select(
      `*,
      tickets (
        id,
        name,
        final_price_cents,
        currency,
        race:races!tickets_race_id_fkey ( id, name, type )
      ),
      price_tiers:event_price_tiers (*)
    `,
    )

  if (error) throw new Error(error.message)

  const eventsWithEffectiveStatus = (data ?? []).map((event) => ({
    ...event,
    status: getEffectiveEventStatus(event),
  }))

  const featured = selectFeaturedEvent(eventsWithEffectiveStatus)
  if (!featured) return { event: null }

  const { count: totalRegistrations } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', featured.id)
    .is('cancelled_at', null)

  const availableSpots = Math.max((featured.capacity || 0) - (totalRegistrations || 0), 0)

  return { event: featured, availableSpots }
}
