import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Public: every open departure slot (SAS) per wave-based ticket, with the
 * places left. Display-only — no distance filter. The registration form still
 * applies the distance window (FDR-0012) before a slot can be confirmed.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const admin = supabaseAdmin()

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  const { data: event, error: eventError } = await admin
    .from('events')
    .select('id')
    .eq(isUUID ? 'id' : 'slug', id)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
  }

  const { data: tickets, error: ticketsError } = await admin
    .from('tickets')
    .select('id, name, operations_config')
    .eq('event_id', event.id)

  if (ticketsError) {
    console.error('[open-waves/overview] tickets error', ticketsError)
    return NextResponse.json({ error: 'Impossible de récupérer les billets' }, { status: 500 })
  }

  const waveTickets = (tickets ?? []).filter((t) => t.operations_config?.departure_mode === 'wave')
  if (waveTickets.length === 0) return NextResponse.json({ tickets: [] })

  const { data: waves, error: wavesError } = await admin
    .from('event_waves')
    .select('ticket_id, wave_index, start_time, capacity, assigned_count')
    .eq('event_id', event.id)
    .in('ticket_id', waveTickets.map((t) => t.id))
    .eq('is_closed', false)
    .order('start_time', { ascending: true })

  if (wavesError) {
    console.error('[open-waves/overview] waves error', wavesError)
    return NextResponse.json({ error: 'Impossible de récupérer les SAS' }, { status: 500 })
  }

  return NextResponse.json({
    tickets: waveTickets.map((ticket) => ({
      ticket_id: ticket.id,
      ticket_name: ticket.name,
      waves: (waves ?? [])
        .filter((w) => w.ticket_id === ticket.id)
        .map((w) => ({
          wave_index: w.wave_index,
          start_time: w.start_time,
          remaining: Math.max((w.capacity ?? 0) - (w.assigned_count ?? 0), 0),
        })),
    })),
  })
}
