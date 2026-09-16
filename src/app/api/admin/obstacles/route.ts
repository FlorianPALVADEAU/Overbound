import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }
    const supabase = await createSupabaseServer()

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
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
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
