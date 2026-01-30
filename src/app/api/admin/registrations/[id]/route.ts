import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'

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

    const admin = supabaseAdmin()

    // Vérifier que l'inscription existe
    const { data: registration, error: fetchError } = await admin
      .from('registrations')
      .select('id, email, event_id, ticket_id, order_id')
      .eq('id', id)
      .single()

    if (fetchError || !registration) {
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 })
    }

    // Supprimer l'inscription
    const { error: deleteError } = await admin
      .from('registrations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erreur suppression registration:', deleteError)
      throw deleteError
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur DELETE registration:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const DELETE = withRequestLogging(handleDelete, {
  actionType: 'Suppression inscription admin',
})
