import { supabaseAdmin } from '@/lib/supabase/server'
import { getEffectiveEventStatus } from '@/lib/events/registrationStatus'
import type { EventDetailResponse } from '@/app/api/events/[id]/eventDetailQueries'

export type PublicEventDetail = Pick<EventDetailResponse, 'event' | 'availableSpots'>

const isUUID = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

const EVENT_DETAIL_SELECT = `*,
  tickets (
    id,
    name,
    description,
    final_price_cents,
    currency,
    max_participants,
    requires_document,
    document_types,
    race:races!tickets_race_id_fkey (
      id,
      name,
      type,
      difficulty,
      target_public,
      distance_km,
      description,
      gallery_images,
      obstacles:race_obstacles!race_obstacles_race_id_fkey(
        order_position,
        is_mandatory,
        obstacle:obstacles!race_obstacles_obstacle_id_fkey(*))
    )
  ),
  price_tiers:event_price_tiers (*)
`

/**
 * Server-side read of the public part of an event page (event, tickets,
 * price tiers, remaining spots), by id or slug. Shared by `/api/events/[id]`
 * and the event page, which renders it into the HTML. Nothing here depends
 * on the visitor: the page stays cacheable, and the visitor's own
 * registration is added by the API route.
 * Returns null when the event does not exist; throws on a database error.
 */
export async function loadPublicEventDetail(id: string): Promise<PublicEventDetail | null> {
  const admin = supabaseAdmin()

  const { data: event, error } = await admin
    .from('events')
    .select(EVENT_DETAIL_SELECT)
    .eq(isUUID(id) ? 'id' : 'slug', id)
    .maybeSingle()

  if (error) throw error
  if (!event) return null

  const { count: totalRegistrations, error: countError } = await admin
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)
    .is('cancelled_at', null)

  if (countError) throw countError

  const availableSpots = Math.max((event.capacity || 0) - (totalRegistrations || 0), 0)

  return {
    event: {
      ...event,
      tickets: (event.tickets || []).map((ticket: Record<string, unknown>) => ({
        ...ticket,
        requires_document: false,
        document_types: [],
      })),
      status: getEffectiveEventStatus(event),
    } as PublicEventDetail['event'],
    availableSpots,
  }
}
