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
      event_id,
      race_id,
      name,
      description,
      price,
      currency,
      max_participants,
      requires_document,
      document_types
    } = body

    // Utiliser supabaseAdmin pour modifier
    const admin = supabaseAdmin()
    const { data: ticket, error } = await admin
      .from('tickets')
      .update({
        event_id,
        race_id: race_id || null,
        name,
        description: description || null,
        final_price_cents: parseInt(price),
        currency: currency || 'eur',
        max_participants: parseInt(max_participants) || 0,
        requires_document: requires_document || false,
        document_types: document_types || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
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
    console.error('Erreur PUT ticket:', error)
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

    // Vérifier le paramètre force dans l'URL
    const url = new URL(request.url)
    const forceDelete = url.searchParams.get('force') === 'true'

    // Vérifier s'il y a des inscriptions utilisant ce ticket
    const { count } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('ticket_id', id)

    if (count && count > 0 && !forceDelete) {
      return NextResponse.json(
        {
          error: 'Ce ticket a des inscriptions existantes',
          registrationCount: count,
          requiresConfirmation: true
        },
        { status: 409 }
      )
    }

    const admin = supabaseAdmin()

    // Si force delete et il y a des inscriptions, les supprimer d'abord
    if (count && count > 0 && forceDelete) {
      const { error: regError } = await admin
        .from('registrations')
        .delete()
        .eq('ticket_id', id)

      if (regError) {
        console.error('Erreur suppression inscriptions:', regError)
        return NextResponse.json(
          { error: 'Erreur lors de la suppression des inscriptions associées' },
          { status: 500 }
        )
      }
    }

    // Supprimer le ticket
    const { error } = await admin
      .from('tickets')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, deletedRegistrations: forceDelete ? count : 0 })

  } catch (error) {
    console.error('Erreur DELETE ticket:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const PUT = withRequestLogging(handlePut, {
  actionType: 'Mise à jour ticket admin',
})

export const DELETE = withRequestLogging(handleDelete, {
  actionType: 'Suppression ticket admin',
})
