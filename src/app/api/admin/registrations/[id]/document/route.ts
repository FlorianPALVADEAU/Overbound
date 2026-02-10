import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

const BUCKET_NAME = 'registration-documents'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const searchParams = new URL(request.url).searchParams
    const documentId = searchParams.get('document_id') || searchParams.get('documentId')
    const documentType = searchParams.get('document_type')
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

    const registrationId = params.id

    const adminClient = supabaseAdmin()
    let documentUrl: string | null = null
    let documentFilename: string | null = null
    let documentSize: number | null = null
    let documentRowId: string | null = null

    if (documentId || documentType) {
      const { data: documentRow, error: documentError } = await adminClient
        .from('registration_documents')
        .select('id, document_url, document_filename, document_size')
        .eq('registration_id', registrationId)
        .eq(documentId ? 'id' : 'document_type', documentId ? documentId : documentType)
        .maybeSingle()

      if (documentError) {
        throw documentError
      }

      documentUrl = documentRow?.document_url ?? null
      documentFilename = documentRow?.document_filename ?? null
      documentSize = documentRow?.document_size ?? null
      documentRowId = documentRow?.id ?? null

      if (!documentUrl) {
        const { data: registrationFallback } = await adminClient
          .from('registrations')
          .select('document_url, document_filename, document_size')
          .eq('id', registrationId)
          .maybeSingle()

        documentUrl = registrationFallback?.document_url ?? null
        documentFilename = registrationFallback?.document_filename ?? null
        documentSize = registrationFallback?.document_size ?? null
      }
    } else {
      const { data: registration, error: registrationError } = await adminClient
        .from('registrations')
        .select('id, document_url, document_filename, document_size')
        .eq('id', registrationId)
        .maybeSingle()

      if (registrationError) {
        throw registrationError
      }

      documentUrl = registration?.document_url ?? null
      documentFilename = registration?.document_filename ?? null
      documentSize = registration?.document_size ?? null
    }

    if (!documentUrl) {
      return NextResponse.json({ error: 'Aucun document pour cette inscription' }, { status: 404 })
    }

    const extractPath = (value: string): string | null => {
      if (!value) return null
      const marker = `${BUCKET_NAME}/`
      if (value.includes(marker)) {
        return value.slice(value.indexOf(marker) + marker.length)
      }
      try {
        const parsed = new URL(value)
        const idx = parsed.pathname.indexOf(marker)
        if (idx >= 0) {
          return parsed.pathname.slice(idx + marker.length)
        }
      } catch {
        // ignore, value is probably already a path
      }
      return value
    }

    const objectPath = extractPath(documentUrl)
    if (!objectPath) {
      return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
    }

    const normalizedUrl = `${BUCKET_NAME}/${objectPath}`
    if (documentUrl !== normalizedUrl) {
      if (documentRowId) {
        await adminClient
          .from('registration_documents')
          .update({ document_url: normalizedUrl })
          .eq('id', documentRowId)
      } else {
        await adminClient
          .from('registrations')
          .update({ document_url: normalizedUrl })
          .eq('id', registrationId)
      }
    }

    const { data: signedData, error: signedError } = await adminClient.storage
      .from(BUCKET_NAME)
      .createSignedUrl(objectPath, 60 * 10)

    if (signedError || !signedData?.signedUrl) {
      throw signedError ?? new Error('Impossible de générer une URL signée')
    }

    return NextResponse.json({
      url: signedData.signedUrl,
      filename: documentFilename,
      size: documentSize,
    })
  } catch (error) {
    console.error('[admin document] error:', error)
    return NextResponse.json({ error: 'Impossible de récupérer le document' }, { status: 500 })
  }
}
