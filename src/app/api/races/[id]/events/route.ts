import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServer()
    const { id } = await params

    // Récupérer les événements qui ont des tickets pour cette course
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        date,
        location,
        status,
        capacity,
        tickets!inner (
          race_id
        )
      `)
      .eq('tickets.race_id', id)
      .in('status', ['on_sale', 'sold_out'])
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })

    if (error) {
      throw error
    }

    // Pour chaque événement, compter les inscriptions
    const eventsWithCount = await Promise.all(
      (events || []).map(async (event) => {
        const { count } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)

        return {
          ...event,
          registrations_count: count || 0
        }
      })
    )

    return NextResponse.json({ events: eventsWithCount })

  } catch (error) {
    console.error('Erreur GET race events:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}