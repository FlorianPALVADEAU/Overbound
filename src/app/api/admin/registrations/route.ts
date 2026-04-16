import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import {
  buildOrderSummaries,
  countRegistrationsByOrder,
} from '@/lib/admin/orderRevenue'

const isTshirtUpsell = (item: { name?: string | null; meta?: Record<string, any> | null }) => {
  const name = String(item.name ?? '').toLowerCase()
  if (/t\s*-?\s*shirt|maillot/.test(name)) return true
  const sizes = (item.meta as any)?.sizes
  const size = (item.meta as any)?.size
  return Array.isArray(sizes) || typeof size === 'string'
}

const extractTshirtSizes = (items: Array<{ meta?: Record<string, any> | null }>) => {
  const values: string[] = []
  for (const item of items) {
    const sizes = (item.meta as any)?.sizes
    const size = (item.meta as any)?.size
    if (Array.isArray(sizes)) {
      for (const raw of sizes) {
        if (typeof raw === 'string' && raw.trim().length > 0) values.push(raw.trim())
      }
      continue
    }
    if (typeof size === 'string' && size.trim().length > 0) {
      values.push(size.trim())
    }
  }
  return values
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const approvalFilter = searchParams.get('approval_filter')
    const searchTerm = searchParams.get('search_term')
    const limitParam = searchParams.get('limit')
    const format = searchParams.get('format')
    const limitCount = parseInt(limitParam || (format === 'csv' ? '10000' : '50'))
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
    const profileIds = Array.from(
      new Set(
        rows
          .map((row: any) => row.user_id)
          .filter((value: string | null) => Boolean(value)),
      ),
    ) as string[]

    const adminClient = supabaseAdmin()

    const [eventsResult, ticketsResult, ordersResult, profilesResult] = await Promise.all([
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
            .select('id, amount_total, currency, status, email, provider, provider_order_id, created_at, invoice_url')
            .in('id', orderIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      profileIds.length
        ? adminClient
            .from('profiles')
            .select('id, full_name')
            .in('id', profileIds)
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
    if (profilesResult.error) {
      console.error('[admin registrations] profiles fetch error', profilesResult.error)
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
    const orderRegistrationIdsMap = new Map<string, string[]>()
    const registrationOrderMap = new Map<string, string>()
    const orderPromoIdsMap = new Map<string, Set<string>>()
    const orderPromotionalCodesMap = new Map<string, any[]>()
    const orderUpsellItemsMap = new Map<string, any[]>()
    const profileMap = new Map<string, { id: string; full_name: string | null }>()
    for (const profile of profilesResult.data ?? []) {
      profileMap.set(profile.id, {
        id: profile.id,
        full_name: profile.full_name ?? null,
      })
    }

    if (orderIds.length > 0) {
      const { data: orderRegistrationRows, error: orderRegistrationRowsError } = await adminClient
        .from('registrations')
        .select('id, order_id, promotional_code_id')
        .in('order_id', orderIds)

      if (orderRegistrationRows) {
        for (const row of orderRegistrationRows as any[]) {
          const registrationId = row.id as string | null
          const orderId = row.order_id as string | null
          const promotionalCodeId = row.promotional_code_id as string | null
          if (!registrationId || !orderId) continue

          registrationOrderMap.set(registrationId, orderId)

          if (!orderRegistrationIdsMap.has(orderId)) {
            orderRegistrationIdsMap.set(orderId, [])
          }
          orderRegistrationIdsMap.get(orderId)!.push(registrationId)

          if (promotionalCodeId) {
            if (!orderPromoIdsMap.has(orderId)) {
              orderPromoIdsMap.set(orderId, new Set())
            }
            orderPromoIdsMap.get(orderId)!.add(promotionalCodeId)
          }
        }
      }

      const promoIds = Array.from(
        new Set(
          Array.from(orderPromoIdsMap.values())
            .flatMap((set) => Array.from(set)),
        ),
      )

      const [promoRowsResult, upsellRowsResult] = await Promise.all([
        promoIds.length
          ? adminClient
              .from('promotional_codes')
              .select('id, code, name, discount_percent, discount_amount, currency, is_active')
              .in('id', promoIds)
          : Promise.resolve({ data: [] as any[], error: null }),
        registrationOrderMap.size
          ? adminClient
              .from('registration_upsells')
              .select('registration_id, name, price_cents, quantity, currency, meta')
              .in('registration_id', Array.from(registrationOrderMap.keys()))
          : Promise.resolve({ data: [] as any[], error: null }),
      ])

      if (promoRowsResult.error) {
        console.error('[admin registrations] promotional codes fetch error', promoRowsResult.error)
      }
      if (upsellRowsResult.error && (upsellRowsResult.error as any)?.code !== 'PGRST205') {
        console.error('[admin registrations] registration upsells fetch error', upsellRowsResult.error)
      }

      const promoMap = new Map<string, any>()
      for (const promo of promoRowsResult.data ?? []) {
        promoMap.set(promo.id, {
          id: promo.id,
          code: promo.code ?? null,
          name: promo.name ?? null,
          discount_percent: promo.discount_percent ?? null,
          discount_amount: promo.discount_amount ?? null,
          currency: promo.currency ?? null,
          is_active: promo.is_active ?? null,
        })
      }

      for (const [orderId, promoIdSet] of orderPromoIdsMap.entries()) {
        const promoCodes = Array.from(promoIdSet)
          .map((promoId) => promoMap.get(promoId))
          .filter(Boolean)
        orderPromotionalCodesMap.set(orderId, promoCodes)
      }

      for (const upsellRow of upsellRowsResult.data ?? []) {
        const registrationId = upsellRow.registration_id as string | null
        if (!registrationId) continue
        const orderId = registrationOrderMap.get(registrationId)
        if (!orderId) continue
        if (!orderUpsellItemsMap.has(orderId)) orderUpsellItemsMap.set(orderId, [])

        orderUpsellItemsMap.get(orderId)!.push({
          registration_id: registrationId,
          name: upsellRow.name ?? null,
          price_cents: upsellRow.price_cents ?? null,
          quantity: upsellRow.quantity ?? null,
          currency: upsellRow.currency ?? null,
          meta: upsellRow.meta ?? null,
        })
      }

      const summaries = buildOrderSummaries({
        orders: (ordersResult.data ?? []).map((order) => ({
          id: order.id,
          amount_total: order.amount_total,
          currency: order.currency,
          status: order.status,
        })),
        registrationsByOrder: countRegistrationsByOrder(orderRegistrationRows ?? []),
      })

      if (orderRegistrationRowsError) {
        console.error('[admin registrations] order registrations count error', orderRegistrationRowsError)
      }

      const ordersDataById = new Map<string, any>()
      for (const order of ordersResult.data ?? []) {
        ordersDataById.set(order.id, order)
      }

      for (const [orderId, summary] of summaries.entries()) {
        const raw = ordersDataById.get(orderId)
        orderMap.set(orderId, {
          ...summary,
          email: raw?.email ?? null,
          provider: raw?.provider ?? null,
          provider_order_id: raw?.provider_order_id ?? null,
          created_at: raw?.created_at ?? null,
          invoice_url: raw?.invoice_url ?? null,
          promotional_codes: orderPromotionalCodesMap.get(orderId) ?? [],
          upsell_items: orderUpsellItemsMap.get(orderId) ?? [],
        })
      }
    }

    const documentCountMap = new Map<string, number>()
    const documentTypeMap = new Map<string, Set<string>>()
    const signaturesMap = new Map<string, Array<{ registration_id: string; regulation_version: string; signed_at: string }>>()
    if (registrationIds.length > 0) {
      const { data: documentRows, error: documentRowsError } = await adminClient
        .from('registration_documents')
        .select('registration_id, document_type')
        .in('registration_id', registrationIds)

      if (documentRowsError) {
        console.error('[admin registrations] registration documents error', documentRowsError)
      } else if (documentRows) {
        for (const row of documentRows as any[]) {
          const current = documentCountMap.get(row.registration_id) ?? 0
          documentCountMap.set(row.registration_id, current + 1)
          if (!documentTypeMap.has(row.registration_id)) {
            documentTypeMap.set(row.registration_id, new Set())
          }
          if (row.document_type) {
            documentTypeMap.get(row.registration_id)!.add(row.document_type)
          }
        }
      }

      const { data: signatureRows, error: signatureRowsError } = await adminClient
        .from('registration_signatures')
        .select('registration_id, regulation_version, signed_at')
        .in('registration_id', registrationIds)
        .order('signed_at', { ascending: false })

      if (signatureRowsError) {
        console.error('[admin registrations] signatures fetch error', signatureRowsError)
      } else if (signatureRows) {
        for (const row of signatureRows as any[]) {
          const registrationId = row.registration_id as string
          if (!signaturesMap.has(registrationId)) {
            signaturesMap.set(registrationId, [])
          }
          signaturesMap.get(registrationId)!.push({
            registration_id: registrationId,
            regulation_version: row.regulation_version ?? '',
            signed_at: row.signed_at ?? '',
          })
        }
      }
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
          start_time,
          wave_index,
          wave_capacity,
          wave_position,
          auto_assigned,
          distance_ideal_km,
          distance_min_km,
          preferred_window_start,
          preferred_window_end,
          latest_allowed_time,
          assignment_constraint_breached,
          ticket:tickets(id, name, distance_km, requires_document, document_types),
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
          const requiredCount =
            Array.isArray(ticketRecord?.document_types) && ticketRecord.document_types.length > 0
              ? ticketRecord.document_types.length
              : (requiresDocument ? 1 : 0)
          const uploadedCount = documentCountMap.get(row.id) ?? (documentUrl ? 1 : 0)
          const documentsComplete = requiredCount === 0 ? true : uploadedCount >= requiredCount
          const uploadedTypes = Array.from(documentTypeMap.get(row.id) ?? [])

          documentMetaMap.set(row.id, {
          document_url: documentUrl,
          document_filename: row.document_filename ?? null,
          document_size: row.document_size ?? null,
          requires_document: requiresDocument,
          approval_status: approvalStatus,
          start_time: row.start_time ?? null,
          wave_index: row.wave_index ?? null,
          wave_capacity: row.wave_capacity ?? null,
          wave_position: row.wave_position ?? null,
          auto_assigned: row.auto_assigned ?? null,
          distance_ideal_km: row.distance_ideal_km ?? null,
          distance_min_km: row.distance_min_km ?? null,
          preferred_window_start: row.preferred_window_start ?? null,
          preferred_window_end: row.preferred_window_end ?? null,
          latest_allowed_time: row.latest_allowed_time ?? null,
          assignment_constraint_breached: row.assignment_constraint_breached ?? null,
          documents_count: uploadedCount,
          required_documents_count: requiredCount,
          uploaded_document_types: uploadedTypes,
          document_requires_attention:
            requiresDocument && (approvalStatus !== 'approved' || !documentsComplete),
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
                  document_types: Array.isArray(ticketRecord.document_types)
                    ? ticketRecord.document_types
                    : [],
                }
              : null,
            order: orderRecord
              ? {
                  id: orderRecord.id ?? null,
                  amount_total: orderRecord.amount_total ?? null,
                  amount_per_registration:
                    orderMap.get(orderRecord.id ?? '')?.amount_per_registration ?? null,
                  registrations_count:
                    orderMap.get(orderRecord.id ?? '')?.registrations_count ?? null,
                  currency: orderRecord.currency ?? null,
                  status: orderRecord.status ?? null,
                  email: orderMap.get(orderRecord.id ?? '')?.email ?? null,
                  provider: orderMap.get(orderRecord.id ?? '')?.provider ?? null,
                  provider_order_id: orderMap.get(orderRecord.id ?? '')?.provider_order_id ?? null,
                  created_at: orderMap.get(orderRecord.id ?? '')?.created_at ?? null,
                  invoice_url: orderMap.get(orderRecord.id ?? '')?.invoice_url ?? null,
                }
              : null,
          })
        }
      }
    }

    const enrichedRows = rows.map((row: any) => {
      const meta = documentMetaMap.get(row.id) || {}
      const orderId = row.order_id ?? meta.order?.id ?? null
      const orderDetails = orderId ? (orderMap.get(orderId) ?? {}) : {}
      const promotionalCodes = Array.isArray(orderDetails.promotional_codes)
        ? orderDetails.promotional_codes
        : []
      const upsellItems = Array.isArray(orderDetails.upsell_items)
        ? orderDetails.upsell_items
        : []
      const tshirtItems = upsellItems.filter((item: any) => isTshirtUpsell(item))
      const tshirtQuantity = tshirtItems.reduce(
        (acc: number, item: any) => acc + Math.max(0, Number(item.quantity || 0)),
        0,
      )
      const tshirtSizes = extractTshirtSizes(tshirtItems)

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
        promotional_codes: promotionalCodes,
        upsell_items: upsellItems,
        has_tshirt: tshirtQuantity > 0,
        tshirt_quantity: tshirtQuantity,
        tshirt_sizes: tshirtSizes,
        participant_profile:
          row.user_id
            ? profileMap.get(row.user_id) ?? null
            : null,
        approval_status: meta.approval_status ?? row.approval_status,
        document_url: meta.document_url ?? row.document_url ?? null,
        document_filename: meta.document_filename ?? row.document_filename ?? null,
        document_size: meta.document_size ?? row.document_size ?? null,
        requires_document: meta.requires_document ?? row.requires_document ?? false,
        start_time: meta.start_time ?? row.start_time ?? null,
        wave_index: meta.wave_index ?? row.wave_index ?? null,
        wave_capacity: meta.wave_capacity ?? row.wave_capacity ?? null,
        wave_position: meta.wave_position ?? row.wave_position ?? null,
        auto_assigned: meta.auto_assigned ?? row.auto_assigned ?? null,
        distance_ideal_km: meta.distance_ideal_km ?? row.distance_ideal_km ?? null,
        distance_min_km: meta.distance_min_km ?? row.distance_min_km ?? null,
        preferred_window_start: meta.preferred_window_start ?? row.preferred_window_start ?? null,
        preferred_window_end: meta.preferred_window_end ?? row.preferred_window_end ?? null,
        latest_allowed_time: meta.latest_allowed_time ?? row.latest_allowed_time ?? null,
        assignment_constraint_breached: meta.assignment_constraint_breached ?? row.assignment_constraint_breached ?? null,
        documents_count: meta.documents_count ?? null,
        required_documents_count: meta.required_documents_count ?? null,
        uploaded_document_types: meta.uploaded_document_types ?? null,
        document_requires_attention:
          meta.document_requires_attention ??
          (meta.requires_document && (!meta.document_url || meta.approval_status !== 'approved')),
        signatures: signaturesMap.get(row.id) ?? [],
      }
    })

    if (format === 'csv') {
      const header = [
        'registration_id',
        'email',
        'event_title',
        'ticket_name',
        'start_time',
        'wave_index',
        'wave_position',
        'distance_min_km',
        'distance_ideal_km',
        'assignment_constraint_breached',
      ]
      const lines = [header.join(',')]
      for (const row of enrichedRows) {
        const values = [
          row.id,
          row.email,
          row.event?.title ?? '',
          row.ticket?.name ?? '',
          row.start_time ?? '',
          row.wave_index ?? '',
          row.wave_position ?? '',
          row.distance_min_km ?? '',
          row.distance_ideal_km ?? '',
          row.assignment_constraint_breached ?? '',
        ]
        lines.push(values.map((value: any) => JSON.stringify(value ?? '')).join(','))
      }
      return new NextResponse(lines.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=\"registrations-${eventId ?? 'all'}.csv\"`,
        },
      })
    }

    return NextResponse.json({
      registrations: enrichedRows,
      totalCount,
    })


  } catch (error) {
    console.error('Erreur GET registrations:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
