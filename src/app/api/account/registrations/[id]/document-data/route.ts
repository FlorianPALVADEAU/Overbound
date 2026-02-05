import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: registration, error } = await supabase
      .from('registrations')
      .select(
        `*,
        ticket:tickets (
          id,
          name,
          description,
          requires_document,
          document_types,
          race:races!tickets_race_id_fkey (
            id,
            name,
            type,
            difficulty,
            distance_km
          )
        ),
        event:events (
          id,
          title,
          subtitle,
          date,
          location
        )
      `,
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !registration) {
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 })
    }

    const admin = supabaseAdmin()
    const { data: documents, error: documentsError } = await admin
      .from('registration_documents')
      .select('id, registration_id, document_type, document_url, document_filename, document_size, status, rejection_reason, approved_at, approved_by, uploaded_at')
      .eq('registration_id', registration.id)
      .order('uploaded_at', { ascending: false })

    if (documentsError) {
      console.error('[document-data] documents fetch error', documentsError)
    }

    const documentsList =
      documents && documents.length > 0
        ? documents
        : registration.document_url
          ? [
              {
                id: 'legacy',
                registration_id: registration.id,
                document_type: 'document',
                document_url: registration.document_url,
                document_filename: registration.document_filename ?? 'Document',
                document_size: registration.document_size ?? 0,
                status: registration.approval_status ?? 'pending',
                rejection_reason: registration.rejection_reason ?? null,
                approved_at: registration.approved_at ?? null,
                approved_by: registration.approved_by ?? null,
                uploaded_at: registration.created_at ?? new Date().toISOString(),
              },
            ]
          : []

    return NextResponse.json({
      registration: {
        ...registration,
        documents: documentsList,
      },
    })
  } catch (err) {
    console.error('[document-data] unexpected error', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
