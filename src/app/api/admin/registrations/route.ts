import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const approvalFilter = searchParams.get('approval_filter')
    const searchTerm = searchParams.get('search_term')
    const limitCount = parseInt(searchParams.get('limit') || '50')
    const offsetCount = parseInt(searchParams.get('offset') || '0')

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

    const { data, error } = await supabase.rpc('get_registrations_with_filters', {
      args: {
        approval: approvalFilter === 'all' ? null : approvalFilter,
        event_id: eventId || null,
        search: searchTerm || null,
        limit: Number.isFinite(limitCount) ? limitCount : 50,
        offset: Number.isFinite(offsetCount) ? offsetCount : 0,
      },
    })

    if (error) throw error

    const rows = data ?? []
    const totalCount = rows[0]?.total_count ?? 0

    const registrationIds = rows.map((row: any) => row.id).filter(Boolean)

    const documentMetaMap = new Map<string, any>()
    if (registrationIds.length > 0) {
      const adminClient = supabaseAdmin()
      const { data: documentRows, error: documentError } = await adminClient
        .from('registrations')
        .select(
          `
          id,
          document_url,
          document_filename,
          document_size,
          approval_status,
          ticket:tickets(requires_document)
        `,
        )
        .in('id', registrationIds)

      if (documentError) {
        console.error('[admin registrations] document fetch error', documentError)
      } else {
        for (const row of documentRows ?? []) {
          const requiresDocument = Boolean((row as any)?.ticket?.requires_document)
          const approvalStatus = (row as any)?.approval_status ?? 'pending'
          const documentUrl = (row as any)?.document_url ?? null
          documentMetaMap.set(row.id, {
            document_url: documentUrl,
            document_filename: row.document_filename ?? null,
            document_size: row.document_size ?? null,
            requires_document: requiresDocument,
            approval_status: approvalStatus,
            document_requires_attention:
              requiresDocument && (approvalStatus !== 'approved' || !documentUrl),
          })
        }
      }
    }

    const enrichedRows = rows.map((row: any) => {
      const meta = documentMetaMap.get(row.id) || {}
      return {
        ...row,
        approval_status: meta.approval_status ?? row.approval_status,
        document_url: meta.document_url ?? row.document_url ?? null,
        document_filename: meta.document_filename ?? row.document_filename ?? null,
        document_size: meta.document_size ?? row.document_size ?? null,
        requires_document: meta.requires_document ?? row.requires_document ?? false,
        document_requires_attention:
          meta.document_requires_attention ??
          (meta.requires_document && (!meta.document_url || meta.approval_status !== 'approved')),
      }
    })

    return NextResponse.json({
      registrations: enrichedRows,
      totalCount,
    })


  } catch (error) {
    console.error('Erreur GET registrations:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
