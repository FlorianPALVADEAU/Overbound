import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

/**
 * POST endpoint to manually trigger tier progression check for an event
 * This checks if the current active tier code should be deactivated and the next tier activated
 * Only accessible to admins
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID manquant.' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    // Call the database function to check and advance tier progression
    const { data, error } = await admin.rpc('check_and_advance_tier_progression', {
      p_event_id: eventId,
    })

    if (error) {
      console.error('Erreur vérification progression tier:', error)
      return NextResponse.json({ error: 'Erreur lors de la vérification de la progression.' }, { status: 500 })
    }

    return NextResponse.json({
      result: data,
      message: 'Vérification de la progression terminée',
    })
  } catch (error) {
    console.error('Erreur vérification progression tier:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

/**
 * POST endpoint to check progression for ALL events
 * Useful for scheduled jobs or bulk operations
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const admin = supabaseAdmin()

    // Get all events with tier-based promo codes
    const { data: events, error: eventsError } = await admin
      .from('promotional_code_events')
      .select('event_id')
      .not('event_id', 'is', null)

    if (eventsError) {
      console.error('Erreur récupération événements:', eventsError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des événements.' }, { status: 500 })
    }

    // Get unique event IDs
    const eventIds = [...new Set(events?.map((e) => e.event_id) || [])]

    const results: any[] = []

    // Check progression for each event
    for (const eventId of eventIds) {
      try {
        const { data, error } = await admin.rpc('check_and_advance_tier_progression', {
          p_event_id: eventId,
        })

        results.push({
          eventId,
          success: !error,
          result: data,
          error: error?.message,
        })
      } catch (err: any) {
        results.push({
          eventId,
          success: false,
          error: err.message,
        })
      }
    }

    return NextResponse.json({
      message: 'Vérification de la progression terminée pour tous les événements',
      totalEvents: eventIds.length,
      results,
    })
  } catch (error) {
    console.error('Erreur vérification progression tier globale:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
