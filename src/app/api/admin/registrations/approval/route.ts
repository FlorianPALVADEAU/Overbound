import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { notifyDocumentApproved, notifyDocumentRejected } from '@/lib/email/documents'
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
      .select(
        `
          id,
          user_id,
          email,
          approval_status,
          rejection_reason,
          approved_at,
          approved_by,
          event:events(id, title)
        `,
      )
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

    const normalizedEvent = Array.isArray(updatedRegistration.event)
      ? updatedRegistration.event[0] ?? null
      : updatedRegistration.event ?? null

    const { data: participantProfile } = await adminClient
      .from('profiles')
      .select('id, full_name')
      .eq('id', updatedRegistration.user_id)
      .maybeSingle()

    const participantName =
      (updatedRegistration as any).participant_name ??
      participantProfile?.full_name ??
      updatedRegistration.email ??
      null

    if (updatedRegistration.email) {
      try {
        if (status === 'approved') {
          await notifyDocumentApproved({
            registrationId: updatedRegistration.id,
            userId: updatedRegistration.user_id,
            participantName,
            eventTitle: normalizedEvent?.title ?? 'Ton événement',
            email: updatedRegistration.email,
          })
        } else {
          await notifyDocumentRejected({
            registrationId: updatedRegistration.id,
            userId: updatedRegistration.user_id,
            participantName,
            eventTitle: normalizedEvent?.title ?? 'Ton événement',
            email: updatedRegistration.email,
            reason: reason || updatedRegistration.rejection_reason || undefined,
          })
        }
      } catch (notificationError) {
        console.error('Erreur envoi email document status:', notificationError)
      }
    }

    return NextResponse.json({
      registration: {
        ...updatedRegistration,
        participant_name: participantName,
      },
    })
  } catch (error) {
    console.error('Erreur approval:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Mise à jour statut inscription',
})
