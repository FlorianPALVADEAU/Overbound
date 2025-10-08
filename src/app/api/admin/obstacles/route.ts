import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'

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

    // Récupérer tous les obstacles
    const { data: obstacles, error } = await supabase
      .from('obstacles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ obstacles })

  } catch (error) {
    console.error('Erreur GET obstacles:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handlePost = async (request: NextRequest) => {
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

    // Utiliser supabaseAdmin pour insérer
    const admin = supabaseAdmin()
    const { data: obstacle, error } = await admin
      .from('obstacles')
      .insert({
        name,
        description: description || null,
        image_url: image_url || null,
        video_url: video_url || null,
        difficulty: difficultyNum,
        type
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ obstacle })

  } catch (error) {
    console.error('Erreur POST obstacle:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Création obstacle admin',
})
