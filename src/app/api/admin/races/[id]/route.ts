import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { raceInputSchema } from '@/lib/admin/catalogInput'

const handlePut = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }
    const { id } = await params

    const parsed = raceInputSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Données invalides', issues: parsed.error.issues },
        { status: 400 },
      )
    }
    const {
      name,
      logo_url,
      type,
      difficulty,
      target_public,
      distance_km,
      description,
      is_universal,
      obstacle_ids
    } = parsed.data

    // Utiliser supabaseAdmin pour modifier
    const admin = supabaseAdmin()

    // Mettre à jour la course
    const { data: race, error: raceError } = await admin
      .from('races')
      .update({
        name,
        logo_url: logo_url || null,
        type,
        difficulty,
        target_public,
        distance_km,
        description: description || null,
        is_universal: is_universal ?? false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (raceError) {
      throw raceError
    }

    // Obstacles remplacés en une transaction (RPC) : pas de course sans obstacle après un échec à mi-parcours.
    const { error: obstaclesError } = await admin.rpc('admin_set_race_obstacles', {
      p_race_id: id,
      p_obstacle_ids: obstacle_ids ?? [],
    })
    if (obstaclesError) {
      throw new Error(`Remplacement des obstacles échoué : ${obstaclesError.message}`)
    }

    // Récupérer la course mise à jour avec ses obstacles
    const { data: fullRace, error: fetchError } = await admin
      .from('races')
      .select(`
        *,
        obstacles:race_obstacles!race_obstacles_race_id_fkey(
          order_position,
          is_mandatory,
          obstacle:obstacles!race_obstacles_obstacle_id_fkey(*)
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      throw fetchError
    }

    return NextResponse.json({ race: fullRace })

  } catch (error) {
    console.error('Erreur PUT race:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handleDelete = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }
    const { id } = await params
    const admin = supabaseAdmin()

    // A race that is still used (tickets, event links, registrations) is never deleted. The former force
    // branch deleted the registrations of its tickets: paid sales gone. Detach or archive instead.
    const [tickets, eventRaces, registrations] = await Promise.all([
      admin.from('tickets').select('id', { count: 'exact', head: true }).eq('race_id', id),
      admin.from('event_races').select('race_id', { count: 'exact', head: true }).eq('race_id', id),
      admin.from('registrations').select('id', { count: 'exact', head: true }).eq('race_id', id),
    ])
    const readError = tickets.error ?? eventRaces.error ?? registrations.error
    if (readError) {
      throw readError
    }
    const ticketsCount = tickets.count ?? 0
    const eventsCount = eventRaces.count ?? 0
    const registrationsCount = registrations.count ?? 0
    if (ticketsCount + eventsCount + registrationsCount > 0) {
      return NextResponse.json(
        {
          error: 'Cette course est utilisée par des billets, des événements ou des inscriptions : elle ne peut pas être supprimée.',
          ticketsCount,
          eventsCount,
          registrationsCount,
          requiresDetach: true,
        },
        { status: 409 }
      )
    }

    // Supprimer les associations race_obstacles
    const { error: obstacleError } = await admin
      .from('race_obstacles')
      .delete()
      .eq('race_id', id)

    if (obstacleError) {
      throw obstacleError
    }

    // Supprimer la course
    const { error } = await admin
      .from('races')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur DELETE race:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const PUT = withRequestLogging(handlePut, {
  actionType: 'Mise à jour course admin',
})

export const DELETE = withRequestLogging(handleDelete, {
  actionType: 'Suppression course admin',
})
