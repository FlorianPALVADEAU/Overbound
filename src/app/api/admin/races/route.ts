import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

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

    // Récupérer toutes les courses avec leurs obstacles
    const { data: races, error } = await supabase
      .from('races')
      .select(`
        *,
        obstacles:race_obstacles!race_obstacles_race_id_fkey(
          order_position,
          is_mandatory,
          obstacle:obstacles!race_obstacles_obstacle_id_fkey(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ races })

  } catch (error) {
    console.error('Erreur GET races:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

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

    // Validation
    if (!name || !type || !target_public || distance_km === undefined) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    // Utiliser supabaseAdmin pour insérer
    const admin = supabaseAdmin()
    
    // Créer la course
    const { data: race, error: raceError } = await admin
      .from('races')
      .insert({
        name,
        logo_url: logo_url || null,
        type,
        difficulty: parseInt(difficulty) || 5,
        target_public,
        distance_km: parseFloat(distance_km),
        description: description || null
      })
      .select()
      .single()

    if (raceError) {
      throw raceError
    }

    // Associer les obstacles si fournis
    if (obstacle_ids && obstacle_ids.length > 0) {
      const obstacleAssociations = obstacle_ids.map((obstacleId: string, index: number) => ({
        race_id: race.id,
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

    // Récupérer la course avec ses obstacles
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
      .eq('id', race.id)
      .single()

    if (fetchError) {
      throw fetchError
    }

    return NextResponse.json({ race: fullRace })

  } catch (error) {
    console.error('Erreur POST race:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}