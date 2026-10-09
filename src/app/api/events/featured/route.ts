import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { selectFeaturedEvent } from '@/lib/events/featuredEvent'
import { getEffectiveEventStatus } from '@/lib/events/registrationStatus'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createSupabaseServer()
  const admin = supabaseAdmin()

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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const eventsWithEffectiveStatus = (data ?? []).map((event) => ({
    ...event,
    status: getEffectiveEventStatus(event),
  }))

  const featured = selectFeaturedEvent(eventsWithEffectiveStatus)

  if (!featured) {
    return NextResponse.json({ event: null })
  }

  const { count: totalRegistrations } = await admin
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', featured.id)
    .is('cancelled_at', null)

  const availableSpots = Math.max((featured.capacity || 0) - (totalRegistrations || 0), 0)

  return NextResponse.json({ event: featured, availableSpots })
}
