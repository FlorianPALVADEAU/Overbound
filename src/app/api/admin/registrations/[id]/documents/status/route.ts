import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { notifyDocumentApproved, notifyDocumentRejected } from '@/lib/email/documents'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'

const resolveEvent = (event: any) => (Array.isArray(event) ? event[0] ?? null : event ?? null)

const computeApprovalStatus = (
  requiresDocument: boolean,
  requiredTypes: string[],
  documents: Array<{ document_type: string | null; status: string | null; rejection_reason?: string | null }>,
) => {
  if (!requiresDocument) {
    return { status: null, rejectionReason: null }
  }

  const docsByType = new Map<string, { status: string | null; rejection_reason?: string | null }>()
  for (const doc of documents) {
    if (doc.document_type) {
      docsByType.set(doc.document_type, { status: doc.status, rejection_reason: doc.rejection_reason })
    }
  }

  let rejectionReason: string | null = null

  if (requiredTypes.length > 0) {
    let allApproved = true
    let anyRejected = false

    for (const requiredType of requiredTypes) {
      const entry = docsByType.get(requiredType)
      if (!entry) {
        allApproved = false
        continue
      }
      if (entry.status === 'rejected') {
        anyRejected = true
        rejectionReason = entry.rejection_reason ?? rejectionReason
      }
      if (entry.status !== 'approved') {
        allApproved = false
      }
    }

    if (anyRejected) {
      return { status: 'rejected' as const, rejectionReason }
    }
    if (allApproved) {
      return { status: 'approved' as const, rejectionReason: null }
    }
    return { status: 'pending' as const, rejectionReason: null }
  }

  if (documents.length === 0) {
    return { status: 'pending' as const, rejectionReason: null }
  }

  const rejectedDoc = documents.find((doc) => doc.status === 'rejected')
  if (rejectedDoc) {
    return { status: 'rejected' as const, rejectionReason: rejectedDoc.rejection_reason ?? null }
  }

  const allApproved = documents.every((doc) => doc.status === 'approved')
  if (allApproved) {
    return { status: 'approved' as const, rejectionReason: null }
  }

  return { status: 'pending' as const, rejectionReason: null }
}

const handlePost = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const params = await context.params
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const payload = await request.json()
    const documentId = payload?.document_id as string | undefined
    const status = payload?.status as 'approved' | 'rejected' | 'pending' | undefined
    const reason = payload?.reason as string | undefined

    if (!documentId || !status) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    if (documentId === 'legacy') {
      return NextResponse.json(
        { error: 'Document legacy non modifiable' },
        { status: 400 },
      )
    }

    const adminClient = supabaseAdmin()
    const now = new Date().toISOString()

    const { data: document, error: documentError } = await adminClient
      .from('registration_documents')
      .select('id, registration_id, document_type, status')
      .eq('id', documentId)
      .eq('registration_id', params.id)
      .single()

    if (documentError || !document) {
      return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
    }

    const updatePayload =
      status === 'approved'
        ? {
            status: 'approved' as const,
            rejection_reason: null,
            approved_at: now,
            approved_by: user.id,
          }
        : status === 'rejected'
          ? {
              status: 'rejected' as const,
              rejection_reason: reason || null,
              approved_at: null,
              approved_by: user.id,
            }
          : {
              status: 'pending' as const,
              rejection_reason: null,
              approved_at: null,
              approved_by: null,
            }

    const { data: updatedDocument, error: updateError } = await adminClient
      .from('registration_documents')
      .update(updatePayload)
      .eq('id', documentId)
      .select('id, document_type, status, rejection_reason')
      .single()

    if (updateError) {
      throw updateError
    }

    const { data: registration, error: registrationError } = await adminClient
      .from('registrations')
      .select(
        `
        id,
        user_id,
        email,
        approval_status,
        rejection_reason,
        ticket:tickets(requires_document, document_types),
        event:events(id, title)
      `,
      )
      .eq('id', params.id)
      .single()

    if (registrationError || !registration) {
      throw registrationError ?? new Error('Registration not found')
    }

    const { data: documents, error: documentsError } = await adminClient
      .from('registration_documents')
      .select('document_type, status, rejection_reason')
      .eq('registration_id', params.id)

    if (documentsError) {
      throw documentsError
    }

    const normalizedTicket = Array.isArray(registration.ticket)
      ? registration.ticket[0] ?? null
      : registration.ticket ?? null
    const requiresDocument = Boolean(normalizedTicket?.requires_document)
    const requiredTypes = Array.isArray(normalizedTicket?.document_types)
      ? normalizedTicket.document_types
      : []

    const { status: computedStatus, rejectionReason } = computeApprovalStatus(
      requiresDocument,
      requiredTypes,
      documents ?? [],
    )

    let updatedRegistration = registration
    if (computedStatus && computedStatus !== registration.approval_status) {
      const registrationUpdate =
        computedStatus === 'approved'
          ? {
              approval_status: 'approved' as const,
              rejection_reason: null,
              approved_at: now,
              approved_by: user.id,
            }
          : computedStatus === 'rejected'
            ? {
                approval_status: 'rejected' as const,
                rejection_reason: rejectionReason ?? reason ?? null,
                approved_at: null,
                approved_by: user.id,
              }
            : {
                approval_status: 'pending' as const,
                rejection_reason: null,
                approved_at: null,
                approved_by: null,
              }

      const { data: registrationResult, error: registrationUpdateError } = await adminClient
        .from('registrations')
        .update(registrationUpdate)
        .eq('id', params.id)
        .select(
          `
          id,
          user_id,
          email,
          approval_status,
          rejection_reason,
          ticket:tickets(requires_document, document_types),
          event:events(id, title)
        `,
        )
        .single()

      if (registrationUpdateError) {
        throw registrationUpdateError
      }

      updatedRegistration = registrationResult ?? registration

      if (updatedRegistration.email) {
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

        const normalizedEvent = resolveEvent(updatedRegistration.event)

        try {
          if (computedStatus === 'approved') {
            await notifyDocumentApproved({
              registrationId: updatedRegistration.id,
              userId: updatedRegistration.user_id,
              participantName,
              eventTitle: normalizedEvent?.title ?? 'Ton événement',
              email: updatedRegistration.email,
            })
          } else if (computedStatus === 'rejected') {
            await notifyDocumentRejected({
              registrationId: updatedRegistration.id,
              userId: updatedRegistration.user_id,
              participantName,
              eventTitle: normalizedEvent?.title ?? 'Ton événement',
              email: updatedRegistration.email,
              reason: rejectionReason ?? reason ?? updatedRegistration.rejection_reason ?? undefined,
            })
          }
        } catch (notificationError) {
          console.error('[document-status] email error', notificationError)
        }
      }
    }

    return NextResponse.json({
      document: updatedDocument,
      registration: {
        id: updatedRegistration.id,
        approval_status: updatedRegistration.approval_status,
        rejection_reason: updatedRegistration.rejection_reason,
      },
    })
  } catch (error) {
    console.error('[document-status] error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Mise à jour statut document',
})
