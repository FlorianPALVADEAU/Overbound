import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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

    const admin = supabaseAdmin()
    const { data: documents, error } = await admin
      .from('registration_documents')
      .select('id, registration_id, document_type, document_filename, document_size, status, rejection_reason, uploaded_at')
      .eq('registration_id', params.id)
      .order('uploaded_at', { ascending: false })

    if (error) {
      throw error
    }

    if (documents && documents.length > 0) {
      return NextResponse.json({ documents })
    }

    const { data: registration } = await admin
      .from('registrations')
      .select('id, document_url, document_filename, document_size, created_at, approval_status, rejection_reason')
      .eq('id', params.id)
      .maybeSingle()

    if (registration?.document_url) {
      return NextResponse.json({
        documents: [
          {
            id: 'legacy',
            registration_id: registration.id,
            document_type: 'document',
            document_filename: registration.document_filename ?? 'Document',
            document_size: registration.document_size ?? 0,
            status: registration.approval_status ?? 'pending',
            rejection_reason: registration.rejection_reason ?? null,
            uploaded_at: registration.created_at ?? new Date().toISOString(),
          },
        ],
      })
    }

    return NextResponse.json({ documents: [] })
  } catch (error) {
    console.error('[admin documents] error:', error)
    return NextResponse.json({ error: 'Impossible de récupérer les documents' }, { status: 500 })
  }
}
