import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data, error } = await supabase
      .from('races')
      .select(
        `*,
        obstacles:race_obstacles!race_obstacles_race_id_fkey(
          order_position,
          is_mandatory,
          obstacle:obstacles!race_obstacles_obstacle_id_fkey(id, name, type, difficulty)
        )
      `,
      )
      .order('difficulty', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[races] fetch error', err)
    return NextResponse.json({ error: 'Erreur lors de la récupération des courses' }, { status: 500 })
  }
}
