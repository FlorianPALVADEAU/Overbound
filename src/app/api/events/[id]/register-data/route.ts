import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Détecte si c'est un UUID ou un slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(
        `*,
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
            is_universal
          )
        ),
        price_tiers:event_price_tiers(*)
      `,
      )
      .eq(isUUID ? 'id' : 'slug', id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
    }

    const { count: totalRegistrations } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)

    const availableSpots = Math.max((event.capacity || 0) - (totalRegistrations || 0), 0)

    // Get registration counts per ticket
    const ticketIds = (event.tickets || []).map((t: { id: string }) => t.id)
    const { data: ticketRegistrations } = await supabase
      .from('registrations')
      .select('ticket_id')
      .eq('event_id', event.id)
      .in('ticket_id', ticketIds)

    // Count registrations per ticket
    const registrationCountsByTicket: Record<string, number> = {}
    for (const reg of ticketRegistrations || []) {
      if (reg.ticket_id) {
        registrationCountsByTicket[reg.ticket_id] = (registrationCountsByTicket[reg.ticket_id] || 0) + 1
      }
    }

    // Enrich tickets with registration counts
    const ticketsWithCounts = (event.tickets || []).map((ticket: { id: string; max_participants: number }) => ({
      ...ticket,
      current_registrations: registrationCountsByTicket[ticket.id] || 0,
    }))

    const { data: upsellsData, error: upsellError } = await supabase
      .from('upsells')
      .select('*')
      .eq('is_active', true)
      .or(`event_id.eq.${event.id},event_id.is.null`)
      .order('created_at', { ascending: false })

    if (upsellError) {
      console.error('[register-data] upsell fetch error', upsellError)
    }

    return NextResponse.json({
      event,
      tickets: ticketsWithCounts,
      upsells: upsellsData || [],
      availableSpots,
      user: {
        id: user.id,
        email: user.email ?? '',
        fullName: user.user_metadata?.full_name || null,
      },
    })
  } catch (error) {
    console.error('[register-data] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
