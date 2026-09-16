import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import {
  buildOrderSummaries,
  countRegistrationsByOrder,
} from '@/lib/admin/orderRevenue'
import { requireAdmin } from '@/lib/auth/requireAdmin'

type UpsellMeta = { sizes?: unknown; size?: unknown } | null | undefined

interface RawRegistrationRow {
  id: string
  total_count?: number
  event_id: string | null
  ticket_id: string | null
  order_id: string | null
  user_id: string | null
  email: string | null
  start_time: string | null
  wave_index: number | null
  wave_capacity: number | null
  wave_position: number | null
  auto_assigned: boolean | null
  distance_ideal_km: number | null
  distance_min_km: number | null
  preferred_window_start: string | null
  preferred_window_end: string | null
  latest_allowed_time: string | null
  assignment_constraint_breached: boolean | null
  event?: EventSummary | null
  ticket?: TicketSummary | null
  order?: OrderSummary | null
}

interface EventSummary {
  id: string
  title: string | null
  date: string | null
  location: string | null
}

interface TicketSummary {
  id: string
  name: string | null
  distance_km: number | null
}

interface OrderSummary {
  id: string
  amount_total: number | null
  currency: string | null
  status: string | null
  amount_per_registration?: number | null
  registrations_count?: number | null
  email?: string | null
  provider?: string | null
  provider_order_id?: string | null
  created_at?: string | null
  invoice_url?: string | null
  promotional_codes?: PromotionalCodeSummary[]
  upsell_items?: UpsellItem[]
}

interface PromotionalCodeSummary {
  id: string
  code: string | null
  name: string | null
  discount_percent: number | null
  discount_amount: number | null
  currency: string | null
  is_active: boolean | null
}

interface UpsellItem {
  registration_id: string
  name: string | null
  price_cents: number | null
  quantity: number | null
  currency: string | null
  meta: UpsellMeta
}

interface DocumentMeta {
  document_url: null
  document_filename: null
  document_size: null
  requires_document: false
  approval_status: 'approved'
  start_time: string | null
  wave_index: number | null
  wave_capacity: number | null
  wave_position: number | null
  auto_assigned: boolean | null
  distance_ideal_km: number | null
  distance_min_km: number | null
  preferred_window_start: string | null
  preferred_window_end: string | null
  latest_allowed_time: string | null
  assignment_constraint_breached: boolean | null
  documents_count: 0
  required_documents_count: 0
  uploaded_document_types: never[]
  document_requires_attention: false
  event: EventSummary | null
  ticket: (TicketSummary & { requires_document: false; document_types: never[] }) | null
  order: OrderSummary | null
}

const isTshirtUpsell = (item: { name?: string | null; meta?: UpsellMeta }) => {
  const name = String(item.name ?? '').toLowerCase()
  if (/t\s*-?\s*shirt|maillot/.test(name)) return true
  const sizes = item.meta?.sizes
  const size = item.meta?.size
  return Array.isArray(sizes) || typeof size === 'string'
}

const extractTshirtSizes = (items: Array<{ meta?: UpsellMeta }>) => {
  const values: string[] = []
  for (const item of items) {
    const sizes = item.meta?.sizes
    const size = item.meta?.size
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
    const searchTerm = searchParams.get('search_term')
    const limitParam = searchParams.get('limit')
    const format = searchParams.get('format')
    const limitCount = parseInt(limitParam || (format === 'csv' ? '10000' : '50'))
    const offsetCount = parseInt(searchParams.get('offset') || '0')

    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const supabase = await createSupabaseServer()

    const { data, error } = await supabase.rpc('get_registrations_with_filters', {
      args: {
        approval: null,
        event_id: eventId || null,
        search: searchTerm || null,
        limit: Number.isFinite(limitCount) ? limitCount : 50,
        offset: Number.isFinite(offsetCount) ? offsetCount : 0,
      },
    })

    if (error) throw error

    const rows: RawRegistrationRow[] = data ?? []
    const totalCount = rows[0]?.total_count ?? 0

    const registrationIds = rows.map((row) => row.id).filter(Boolean)
    const eventIds = Array.from(
      new Set(
        rows
          .map((row) => row.event_id)
          .filter((value): value is string => Boolean(value)),
      ),
    )
    const ticketIds = Array.from(
      new Set(
        rows
          .map((row) => row.ticket_id)
          .filter((value): value is string => Boolean(value)),
      ),
    )
    const orderIds = Array.from(
      new Set(
        rows
          .map((row) => row.order_id)
          .filter((value): value is string => Boolean(value)),
      ),
    )
    const profileIds = Array.from(
      new Set(
        rows
          .map((row) => row.user_id)
          .filter((value): value is string => Boolean(value)),
      ),
    )

    const adminClient = supabaseAdmin()

    const [eventsResult, ticketsResult, ordersResult, profilesResult] = await Promise.all([
      eventIds.length
        ? adminClient
            .from('events')
            .select('id, title, date, location')
            .in('id', eventIds)
        : Promise.resolve({ data: [] as EventSummary[], error: null }),
      ticketIds.length
        ? adminClient
            .from('tickets')
            .select('id, name, distance_km')
            .in('id', ticketIds)
        : Promise.resolve({ data: [] as TicketSummary[], error: null }),
      orderIds.length
        ? adminClient
            .from('orders')
            .select('id, amount_total, currency, status, email, provider, provider_order_id, created_at, invoice_url')
            .in('id', orderIds)
        : Promise.resolve({ data: [] as OrderSummary[], error: null }),
      profileIds.length
        ? adminClient
            .from('profiles')
            .select('id, full_name')
            .in('id', profileIds)
        : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null }>, error: null }),
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
    const orderMap = new Map<string, OrderSummary>()
    const orderRegistrationIdsMap = new Map<string, string[]>()
    const registrationOrderMap = new Map<string, string>()
    const orderPromoIdsMap = new Map<string, Set<string>>()
    const orderPromotionalCodesMap = new Map<string, PromotionalCodeSummary[]>()
    const orderUpsellItemsMap = new Map<string, UpsellItem[]>()
    const profileMap = new Map<string, { id: string; full_name: string | null }>()
    const groupByProfileMap = new Map<string, { id: string; name: string | null; invite_code: string | null }>()
    for (const profile of profilesResult.data ?? []) {
      profileMap.set(profile.id, {
        id: profile.id,
        full_name: profile.full_name ?? null,
      })
    }

    if (profileIds.length > 0) {
      const { data: membershipRows, error: membershipError } = await adminClient
        .from('group_members')
        .select('profile_id, group:groups(id, name, invite_code)')
        .in('profile_id', profileIds)

      type GroupRef = { id: string; name: string | null; invite_code: string | null }
      type MembershipRow = { profile_id: string; group: GroupRef | GroupRef[] | null }

      if (membershipError) {
        console.error('[admin registrations] group membership fetch error', membershipError)
      } else {
        for (const row of (membershipRows ?? []) as MembershipRow[]) {
          const group = Array.isArray(row.group) ? row.group[0] : row.group
          if (!group?.id) continue
          groupByProfileMap.set(row.profile_id, {
            id: group.id,
            name: group.name ?? null,
            invite_code: group.invite_code ?? null,
          })
        }
      }
    }

    if (orderIds.length > 0) {
      const { data: orderRegistrationRows, error: orderRegistrationRowsError } = await adminClient
        .from('registrations')
        .select('id, order_id, promotional_code_id')
        .in('order_id', orderIds)

      type OrderRegistrationRow = { id: string; order_id: string | null; promotional_code_id: string | null }

      if (orderRegistrationRows) {
        for (const row of orderRegistrationRows as OrderRegistrationRow[]) {
          const registrationId = row.id
          const orderId = row.order_id
          const promotionalCodeId = row.promotional_code_id
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

      type RawUpsellRow = {
        registration_id: string | null
        name: string | null
        price_cents: number | null
        quantity: number | null
        currency: string | null
        meta: UpsellMeta
      }

      const [promoRowsResult, upsellRowsResult] = await Promise.all([
        promoIds.length
          ? adminClient
              .from('promotional_codes')
              .select('id, code, name, discount_percent, discount_amount, currency, is_active')
              .in('id', promoIds)
          : Promise.resolve({ data: [] as PromotionalCodeSummary[], error: null }),
        registrationOrderMap.size
          ? adminClient
              .from('registration_upsells')
              .select('registration_id, name, price_cents, quantity, currency, meta')
              .in('registration_id', Array.from(registrationOrderMap.keys()))
          : Promise.resolve({ data: [] as RawUpsellRow[], error: null }),
      ])

      if (promoRowsResult.error) {
        console.error('[admin registrations] promotional codes fetch error', promoRowsResult.error)
      }
      if (upsellRowsResult.error && (upsellRowsResult.error as { code?: string })?.code !== 'PGRST205') {
        console.error('[admin registrations] registration upsells fetch error', upsellRowsResult.error)
      }

      const promoMap = new Map<string, PromotionalCodeSummary>()
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
          .filter((promo): promo is PromotionalCodeSummary => Boolean(promo))
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

      const ordersDataById = new Map<string, OrderSummary>()
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

    const signaturesMap = new Map<string, Array<{ registration_id: string; regulation_version: string; signed_at: string }>>()
    if (registrationIds.length > 0) {
      const { data: signatureRows, error: signatureRowsError } = await adminClient
        .from('registration_signatures')
        .select('registration_id, regulation_version, signed_at')
        .in('registration_id', registrationIds)
        .order('signed_at', { ascending: false })

      type SignatureRow = { registration_id: string; regulation_version: string | null; signed_at: string | null }

      if (signatureRowsError) {
        console.error('[admin registrations] signatures fetch error', signatureRowsError)
      } else if (signatureRows) {
        for (const row of signatureRows as SignatureRow[]) {
          const registrationId = row.registration_id
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

    type DocumentRow = {
      id: string
      start_time: string | null
      wave_index: number | null
      wave_capacity: number | null
      wave_position: number | null
      auto_assigned: boolean | null
      distance_ideal_km: number | null
      distance_min_km: number | null
      preferred_window_start: string | null
      preferred_window_end: string | null
      latest_allowed_time: string | null
      assignment_constraint_breached: boolean | null
      ticket: TicketSummary | TicketSummary[] | null
      event: EventSummary | EventSummary[] | null
      order: Pick<OrderSummary, 'id' | 'amount_total' | 'currency' | 'status'> | Pick<OrderSummary, 'id' | 'amount_total' | 'currency' | 'status'>[] | null
    }

    const documentMetaMap = new Map<string, DocumentMeta>()
    if (registrationIds.length > 0) {
    const { data: documentRows, error: documentError } = await adminClient
      .from('registrations')
      .select(
        `
          id,
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
          ticket:tickets(id, name, distance_km),
          event:events(id, title, date, location),
          order:orders(id, amount_total, currency, status)
        `,
      )
        .in('id', registrationIds)

      if (documentError) {
        console.error('[admin registrations] document fetch error', documentError)
      } else {
        for (const row of (documentRows ?? []) as unknown as DocumentRow[]) {
          const ticketRecord = Array.isArray(row.ticket) ? row.ticket[0] : row.ticket
          const eventRecord = Array.isArray(row.event) ? row.event[0] : row.event
          const orderRecord = Array.isArray(row.order) ? row.order[0] : row.order

          documentMetaMap.set(row.id, {
          document_url: null,
          document_filename: null,
          document_size: null,
          requires_document: false,
          approval_status: 'approved',
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
          documents_count: 0,
          required_documents_count: 0,
          uploaded_document_types: [],
          document_requires_attention: false,
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
                  requires_document: false,
                  document_types: [],
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

    const enrichedRows = rows.map((row) => {
      const meta: DocumentMeta | undefined = documentMetaMap.get(row.id)
      const orderId = row.order_id ?? meta?.order?.id ?? null
      const orderDetails = orderId ? orderMap.get(orderId) : undefined
      const promotionalCodes = orderDetails?.promotional_codes ?? []
      const upsellItems = orderDetails?.upsell_items ?? []
      const tshirtItems = upsellItems.filter((item) => isTshirtUpsell(item))
      const tshirtQuantity = tshirtItems.reduce(
        (acc, item) => acc + Math.max(0, Number(item.quantity || 0)),
        0,
      )
      const tshirtSizes = extractTshirtSizes(tshirtItems)

      return {
        ...row,
        event:
          meta?.event ??
          row.event ??
          eventMap.get(row.event_id ?? '') ??
          null,
        ticket:
          meta?.ticket ??
          row.ticket ??
          ticketMap.get(row.ticket_id ?? '') ??
          null,
        order:
          meta?.order ??
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
        group:
          row.user_id
            ? groupByProfileMap.get(row.user_id) ?? null
            : null,
        approval_status: 'approved',
        document_url: null,
        document_filename: null,
        document_size: null,
        requires_document: false,
        start_time: meta?.start_time ?? row.start_time ?? null,
        wave_index: meta?.wave_index ?? row.wave_index ?? null,
        wave_capacity: meta?.wave_capacity ?? row.wave_capacity ?? null,
        wave_position: meta?.wave_position ?? row.wave_position ?? null,
        auto_assigned: meta?.auto_assigned ?? row.auto_assigned ?? null,
        distance_ideal_km: meta?.distance_ideal_km ?? row.distance_ideal_km ?? null,
        distance_min_km: meta?.distance_min_km ?? row.distance_min_km ?? null,
        preferred_window_start: meta?.preferred_window_start ?? row.preferred_window_start ?? null,
        preferred_window_end: meta?.preferred_window_end ?? row.preferred_window_end ?? null,
        latest_allowed_time: meta?.latest_allowed_time ?? row.latest_allowed_time ?? null,
        assignment_constraint_breached: meta?.assignment_constraint_breached ?? row.assignment_constraint_breached ?? null,
        documents_count: 0,
        required_documents_count: 0,
        uploaded_document_types: [],
        document_requires_attention: false,
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
        lines.push(values.map((value) => JSON.stringify(value ?? '')).join(','))
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
