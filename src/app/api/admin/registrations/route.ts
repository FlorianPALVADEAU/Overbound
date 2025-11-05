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
    const eventIds = Array.from(
      new Set(
        rows
          .map((row: any) => row.event_id)
          .filter((value: string | null) => Boolean(value)),
      ),
    ) as string[]
    const ticketIds = Array.from(
      new Set(
        rows
          .map((row: any) => row.ticket_id)
          .filter((value: string | null) => Boolean(value)),
      ),
    ) as string[]
    const orderIds = Array.from(
      new Set(
        rows
          .map((row: any) => row.order_id)
          .filter((value: string | null) => Boolean(value)),
      ),
    ) as string[]

    const adminClient = supabaseAdmin()

    const [eventsResult, ticketsResult, ordersResult] = await Promise.all([
      eventIds.length
        ? adminClient
            .from('events')
            .select('id, title, date, location')
            .in('id', eventIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      ticketIds.length
        ? adminClient
            .from('tickets')
            .select('id, name, distance_km')
            .in('id', ticketIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      orderIds.length
        ? adminClient
            .from('orders')
            .select('id, amount_total, currency, status')
            .in('id', orderIds)
        : Promise.resolve({ data: [] as any[], error: null }),
    ])

    if (eventsResult.error) {
      console.error('[admin registrations] events fetch error', eventsResult.error)
    }
    if (ticketsResult.error) {
      console.error('[admin registrations] tickets fetch error', ticketsResult.error)
    }
    if (ordersResult.error) {
      console.error('[admin registrations] orders fetch error', ordersResult.error)
    }

    const eventMap = new Map<string, any>()
    for (const event of eventsResult.data ?? []) {
      eventMap.set(event.id, {
        id: event.id,
        title: event.title ?? null,
        date: event.date ?? null,
        location: event.location ?? null,
      })
    }
    const ticketMap = new Map<string, any>()
    for (const ticket of ticketsResult.data ?? []) {
      ticketMap.set(ticket.id, {
        id: ticket.id,
        name: ticket.name ?? null,
        distance_km: ticket.distance_km ?? null,
      })
    }
    const orderMap = new Map<string, any>()
    for (const order of ordersResult.data ?? []) {
      orderMap.set(order.id, {
        id: order.id,
        amount_total: order.amount_total ?? null,
        currency: order.currency ?? null,
        status: order.status ?? null,
      })
    }

    const documentMetaMap = new Map<string, any>()
    if (registrationIds.length > 0) {
      const { data: documentRows, error: documentError } = await adminClient
        .from('registrations')
        .select(
          `
          id,
          document_url,
          document_filename,
          document_size,
          approval_status,
          ticket:tickets(id, name, distance_km, requires_document),
          event:events(id, title, date, location),
          order:orders(id, amount_total, currency, status)
        `,
        )
        .in('id', registrationIds)

      if (documentError) {
        console.error('[admin registrations] document fetch error', documentError)
      } else {
        for (const row of documentRows ?? []) {
          const ticketRecord = Array.isArray((row as any)?.ticket) ? (row as any).ticket[0] : (row as any)?.ticket
          const eventRecord = Array.isArray((row as any)?.event) ? (row as any).event[0] : (row as any)?.event
          const orderRecord = Array.isArray((row as any)?.order) ? (row as any).order[0] : (row as any)?.order

          const requiresDocument = Boolean(ticketRecord?.requires_document)
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
            event: eventRecord
              ? {
                  id: eventRecord.id ?? null,
                  title: eventRecord.title ?? null,
                  date: eventRecord.date ?? null,
                  location: eventRecord.location ?? null,
                }
              : null,
            ticket: ticketRecord
              ? {
                  id: ticketRecord.id ?? null,
                  name: ticketRecord.name ?? null,
                  distance_km: ticketRecord.distance_km ?? null,
                  requires_document: requiresDocument,
                }
              : null,
            order: orderRecord
              ? {
                  id: orderRecord.id ?? null,
                  amount_total: orderRecord.amount_total ?? null,
                  currency: orderRecord.currency ?? null,
                  status: orderRecord.status ?? null,
                }
              : null,
          })
        }
      }
    }

    const enrichedRows = rows.map((row: any) => {
      const meta = documentMetaMap.get(row.id) || {}
      return {
        ...row,
        event:
          meta.event ??
          row.event ??
          eventMap.get(row.event_id ?? '') ??
          null,
        ticket:
          meta.ticket ??
          row.ticket ??
          ticketMap.get(row.ticket_id ?? '') ??
          null,
        order:
          meta.order ??
          row.order ??
          orderMap.get(row.order_id ?? '') ??
          null,
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
