import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'

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

    const { registration_id, status, reason } = await request.json()

    if (!registration_id || !status) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      )
    }

    const adminClient = supabaseAdmin()
    const now = new Date().toISOString()

    const updatePayload =
      status === 'approved'
        ? {
            approval_status: 'approved' as const,
            rejection_reason: null,
            approved_at: now,
            approved_by: user.id,
          }
        : {
            approval_status: 'rejected' as const,
            rejection_reason: reason || null,
            approved_at: null,
            approved_by: user.id,
          }

    const { data: updatedRegistration, error: updateError } = await adminClient
      .from('registrations')
      .update(updatePayload)
      .eq('id', registration_id)
      .select('id, approval_status, rejection_reason, approved_at, approved_by')
      .single()

    if (updateError) {
      throw updateError
    }

    if (!updatedRegistration) {
      return NextResponse.json(
        { error: 'Inscription introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json({ registration: updatedRegistration })
  } catch (error) {
    console.error('Erreur approval:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Mise à jour statut inscription',
})
