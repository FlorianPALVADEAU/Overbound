import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

const routeParamsSchema = z.object({ id: z.string().uuid() })

/** Values for the participants list filters: the event's tickets and the SAS that exist for them. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const parsedParams = routeParamsSchema.safeParse(await params)
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Identifiant événement invalide' }, { status: 400 })
  }
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const admin = supabaseAdmin()
    const { data: tickets, error: ticketsError } = await admin
      .from('tickets')
      .select('id, name')
      .eq('event_id', parsedParams.data.id)
      .order('name', { ascending: true })
    if (ticketsError) throw ticketsError

    const ticketIds = (tickets ?? []).map((ticket) => ticket.id as string)
    const { data: waves, error: wavesError } = ticketIds.length
      ? await admin.from('event_waves').select('wave_index, start_time').in('ticket_id', ticketIds)
      : { data: [], error: null }
    if (wavesError) throw wavesError

    // The same SAS number can exist for several tickets: list each number once, with its earliest time.
    const waveByIndex = new Map<number, string | null>()
    for (const wave of (waves ?? []) as Array<{ wave_index: number; start_time: string | null }>) {
      const known = waveByIndex.get(wave.wave_index)
      if (known === undefined || (wave.start_time && (!known || wave.start_time < known))) {
        waveByIndex.set(wave.wave_index, wave.start_time)
      }
    }

    return NextResponse.json({
      tickets: (tickets ?? []).map((ticket) => ({ id: ticket.id as string, name: (ticket.name as string | null) ?? 'Billet' })),
      waves: [...waveByIndex.entries()]
        .sort(([left], [right]) => left - right)
        .map(([waveIndex, startTime]) => ({ waveIndex, startTime })),
    })
  } catch (error) {
    console.error('[admin participants options] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
