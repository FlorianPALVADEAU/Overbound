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

    // Récupérer tous les tickets avec les informations des événements et courses
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        event:events(id, title, date, status),
        race:races!tickets_race_id_fkey(id, name, type, difficulty, target_public, distance_km)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ tickets })

  } catch (error) {
    console.error('Erreur GET tickets:', error)
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
      event_id,
      race_id,
      name,
      description,
      price,
      currency,
      max_participants,
    } = body

    // Validation
    if (!name || !event_id || price === undefined) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    // Utiliser supabaseAdmin pour insérer
    const admin = supabaseAdmin()
    const { data: ticket, error } = await admin
      .from('tickets')
      .insert({
        event_id,
        race_id: race_id || null,
        name,
        description: description || null,
        final_price_cents: parseInt(price),
        max_participants: parseInt(max_participants) || 0,
        requires_document: false,
        document_types: [],
        currency: currency || 'eur'
      })
      .select(`
        *,
        event:events(id, title, date, status),
        race:races!tickets_race_id_fkey(id, name, type, difficulty, target_public, distance_km)
      `)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ ticket })

  } catch (error) {
    console.error('Erreur POST ticket:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Création ticket admin',
})
