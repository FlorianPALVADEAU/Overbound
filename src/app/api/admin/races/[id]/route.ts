import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'

const handlePut = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    const { id } = await params
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le rôle admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
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
    } = body

    // Utiliser supabaseAdmin pour modifier
    const admin = supabaseAdmin()

    // Mettre à jour la course
    const { data: race, error: raceError } = await admin
      .from('races')
      .update({
        name,
        logo_url: logo_url || null,
        type,
        difficulty: parseInt(difficulty) || 5,
        target_public,
        distance_km: parseFloat(distance_km),
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

    // Supprimer les anciennes associations d'obstacles
    const { error: deleteError } = await admin
      .from('race_obstacles')
      .delete()
      .eq('race_id', id)

    if (deleteError) {
      console.error('Erreur lors de la suppression des obstacles:', deleteError)
    }

    // Créer les nouvelles associations
    if (obstacle_ids && obstacle_ids.length > 0) {
      const obstacleAssociations = obstacle_ids.map((obstacleId: string, index: number) => ({
        race_id: id,
        obstacle_id: obstacleId,
        order_position: index + 1,
        is_mandatory: true
      }))

      const { error: obstacleError } = await admin
        .from('race_obstacles')
        .insert(obstacleAssociations)

      if (obstacleError) {
        console.error('Erreur lors de l\'association des obstacles:', obstacleError)
      }
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
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    const { id } = await params
    const url = new URL(request.url)
    const forceDelete = url.searchParams.get('force') === 'true'

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le rôle admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const admin = supabaseAdmin()

    // Vérifier s'il y a des tickets utilisant cette course
    const { count: ticketsCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('race_id', id)

    // Vérifier s'il y a des événements utilisant cette course
    const { count: eventsCount } = await supabase
      .from('event_races')
      .select('*', { count: 'exact', head: true })
      .eq('race_id', id)

    const hasRelatedData = (ticketsCount && ticketsCount > 0) ||
      (eventsCount && eventsCount > 0)

    if (hasRelatedData && !forceDelete) {
      return NextResponse.json(
        {
          error: 'Cette course a des données associées',
          ticketsCount: ticketsCount ?? 0,
          eventsCount: eventsCount ?? 0,
          requiresConfirmation: true,
        },
        { status: 409 }
      )
    }

    // Si force delete, supprimer les données associées
    if (forceDelete && hasRelatedData) {
      // D'abord supprimer les inscriptions des tickets de cette course
      if (ticketsCount && ticketsCount > 0) {
        // Récupérer les IDs des tickets
        const { data: tickets } = await supabase
          .from('tickets')
          .select('id')
          .eq('race_id', id)

        if (tickets && tickets.length > 0) {
          const ticketIds = tickets.map(t => t.id)

          // Supprimer les inscriptions associées à ces tickets
          const { error: regError } = await admin
            .from('registrations')
            .delete()
            .in('ticket_id', ticketIds)

          if (regError) {
            console.error('Erreur suppression registrations:', regError)
          }
        }

        // Supprimer les tickets
        const { error: ticketError } = await admin
          .from('tickets')
          .delete()
          .eq('race_id', id)

        if (ticketError) {
          console.error('Erreur suppression tickets:', ticketError)
          throw ticketError
        }
      }

      // Supprimer les associations event_races
      if (eventsCount && eventsCount > 0) {
        const { error: eventRaceError } = await admin
          .from('event_races')
          .delete()
          .eq('race_id', id)

        if (eventRaceError) {
          console.error('Erreur suppression event_races:', eventRaceError)
          throw eventRaceError
        }
      }
    }

    // Supprimer les associations race_obstacles
    const { error: obstacleError } = await admin
      .from('race_obstacles')
      .delete()
      .eq('race_id', id)

    if (obstacleError) {
      console.error('Erreur suppression race_obstacles:', obstacleError)
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
