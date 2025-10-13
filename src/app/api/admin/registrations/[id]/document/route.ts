import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

const BUCKET_NAME = 'registration-documents'

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

    const registrationId = params.id

    const adminClient = supabaseAdmin()
    const { data: registration, error: registrationError } = await adminClient
      .from('registrations')
      .select('id, document_url, document_filename, document_size')
      .eq('id', registrationId)
      .maybeSingle()

    if (registrationError) {
      throw registrationError
    }

    if (!registration || !registration.document_url) {
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

    const objectPath = extractPath(registration.document_url)
    if (!objectPath) {
      return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
    }

    const { data: signedData, error: signedError } = await adminClient.storage
      .from(BUCKET_NAME)
      .createSignedUrl(objectPath, 60 * 10)

    if (signedError || !signedData?.signedUrl) {
      throw signedError ?? new Error('Impossible de générer une URL signée')
    }

    return NextResponse.json({
      url: signedData.signedUrl,
      filename: registration.document_filename,
      size: registration.document_size,
    })
  } catch (error) {
    console.error('[admin document] error:', error)
    return NextResponse.json({ error: 'Impossible de récupérer le document' }, { status: 500 })
  }
}
