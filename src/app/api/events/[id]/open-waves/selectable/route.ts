import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getSelectableWaveWindow } from '@/lib/openSas'
import { z } from 'zod'

export const runtime = 'nodejs'

/**
 * Public: SAS OPEN a participant can pick from, filtered by their declared
 * distance range (FDR-0012). Open, non-full waves inside the window only —
 * this list is a UX convenience; the real check happens again server-side
 * at registration creation (assign_selected_wave_to_registration).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const url = new URL(request.url)
  const distanceIdealKm = Number(url.searchParams.get('distanceIdealKm'))
  const distanceMinKm = Number(url.searchParams.get('distanceMinKm'))
  const ticketId = z.string().uuid().safeParse(url.searchParams.get('ticketId'))

  if (!ticketId.success || !Number.isFinite(distanceIdealKm) || !Number.isFinite(distanceMinKm) || distanceIdealKm < distanceMinKm) {
    return NextResponse.json({ error: 'Distances invalides.' }, { status: 400 })
  }

  const admin = supabaseAdmin()

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  const { data: event, error: eventError } = await admin
    .from('events')
    .select('id, date')
    .eq(isUUID ? 'id' : 'slug', id)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
  }

  const { data: ticket, error: ticketError } = await admin
    .from('tickets')
    .select('id, operations_config')
    .eq('id', ticketId.data)
    .eq('event_id', event.id)
    .maybeSingle()
  if (ticketError || !ticket) {
    return NextResponse.json({ error: 'Billet introuvable pour cet événement.' }, { status: 404 })
  }
  if (ticket.operations_config?.departure_mode !== 'wave') {
    return NextResponse.json({ error: 'Ce billet ne propose pas de départ par SAS.' }, { status: 422 })
  }

  const { data: waves, error: wavesError } = await admin
    .from('event_waves')
    .select('wave_index, start_time, capacity, assigned_count, is_closed')
    .eq('event_id', event.id)
    .eq('ticket_id', ticketId.data)
    .eq('is_closed', false)
    .order('wave_index', { ascending: true })

  if (wavesError) {
    console.error('[open-waves/selectable] fetch error', wavesError)
    return NextResponse.json({ error: 'Impossible de récupérer les SAS' }, { status: 500 })
  }

  const window = getSelectableWaveWindow(event.date, distanceIdealKm, distanceMinKm)
  const windowStartMs = window.start.getTime()
  const windowEndMs = window.end.getTime()

  const selectable = (waves ?? [])
    .filter((wave) => (wave.assigned_count ?? 0) < (wave.capacity ?? 0))
    .filter((wave) => {
      const startMs = new Date(wave.start_time).getTime()
      return startMs >= windowStartMs && startMs <= windowEndMs
    })
    .map((wave) => ({
      wave_index: wave.wave_index,
      start_time: wave.start_time,
      remaining: Math.max((wave.capacity ?? 0) - (wave.assigned_count ?? 0), 0),
    }))

  return NextResponse.json({ waves: selectable })
}
