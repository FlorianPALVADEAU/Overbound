import { createSupabaseServer, supabaseAdmin } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
      description,
      image_url,
      video_url,
      difficulty,
      type
    } = body

    // Validation
    if (!name || !type || difficulty === undefined) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    // Valider la difficulté
    const difficultyNum = parseInt(difficulty)
    if (difficultyNum < 1 || difficultyNum > 10) {
      return NextResponse.json(
        { error: 'La difficulté doit être entre 1 et 10' },
        { status: 400 }
      )
    }

    // Utiliser supabaseAdmin pour modifier
    const admin = supabaseAdmin()
    const { data: obstacle, error } = await admin
      .from('obstacles')
      .update({
        name,
        description: description || null,
        image_url: image_url || null,
        video_url: video_url || null,
        difficulty: difficultyNum,
        type,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ obstacle })

  } catch (error) {
    console.error('Erreur PUT obstacle:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    // Vérifier s'il y a des courses utilisant cet obstacle
    const { count } = await supabase
      .from('race_obstacles')
      .select('*', { count: 'exact', head: true })
      .eq('obstacle_id', id)

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un obstacle utilisé par des courses' },
        { status: 409 }
      )
    }

    // Utiliser supabaseAdmin pour supprimer
    const admin = supabaseAdmin()
    const { error } = await admin
      .from('obstacles')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur DELETE obstacle:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}