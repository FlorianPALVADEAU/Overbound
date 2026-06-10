import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { getEffectiveEventStatus } from '@/lib/events/registrationStatus'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()
    const admin = supabaseAdmin()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Détecte si c'est un UUID ou un slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    const selectQuery = `*,
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
            obstacles:race_obstacles!race_obstacles_race_id_fkey(
              order_position,
              is_mandatory,
              obstacle:obstacles!race_obstacles_obstacle_id_fkey(*))
          )
        ),
        price_tiers:event_price_tiers (*)
      `

    // Cherche par UUID ou par slug selon le format
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(selectQuery)
      .eq(isUUID ? 'id' : 'slug', id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
    }

    const { count: totalRegistrations } = await admin
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)

    const availableSpots = Math.max((event.capacity || 0) - (totalRegistrations || 0), 0)

    let existingRegistration = null
    if (user) {
      const { data: registration } = await supabase
        .from('registrations')
        .select(
          `id, checked_in, tickets(name)`
        )
        .eq('user_id', user.id)
        .eq('event_id', event.id)
        .maybeSingle()
      existingRegistration = registration ?? null
    }

    const effectiveEvent = {
      ...event,
      status: getEffectiveEventStatus(event),
    }

    return NextResponse.json({
      event: effectiveEvent,
      availableSpots,
      existingRegistration,
      user: user
        ? {
            id: user.id,
            email: user.email ?? '',
          }
        : null,
    })
  } catch (error) {
    console.error('[event detail] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
