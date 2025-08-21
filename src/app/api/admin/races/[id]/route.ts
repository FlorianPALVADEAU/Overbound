import { createSupabaseServer, supabaseAdmin } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: { id: Promise<{ id: string }> } }
) {
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
      .eq('id', params.id)
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: Promise<{ id: string }> } }
) {
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

    // Vérifier s'il y a des tickets utilisant cette course
    const { count: ticketCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('race_id', id)

    if (ticketCount && ticketCount > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer une course utilisée par des tickets' },
        { status: 409 }
      )
    }

    // Vérifier s'il y a des événements utilisant cette course
    const { count: eventCount } = await supabase
      .from('event_races')
      .select('*', { count: 'exact', head: true })
      .eq('race_id', id)

    if (eventCount && eventCount > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer une course utilisée par des événements' },
        { status: 409 }
      )
    }

    // Utiliser supabaseAdmin pour supprimer
    const admin = supabaseAdmin()
    
    // Les associations race_obstacles seront supprimées automatiquement (CASCADE)
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