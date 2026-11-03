import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdminOrganization } from '@/lib/auth/requireAdminOrganization'
import {
  decodeOrdersCursor,
  encodeOrdersCursor,
  ordersQuerySchema,
  summarizeOrders,
  type OrderRegistrationRow,
  type OrderRow,
} from '@/lib/admin/ordersList'
import { keysetAfterFilter } from '@/lib/admin/keysetCursor'
import { sanitizeSearchTerm } from '@/lib/admin/participantsQuery'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const COLUMNS = 'id, email, status, amount_total, currency, provider, provider_order_id, invoice_url, created_at'

/** Orders, newest first, with the bibs and refunds behind each one. */
export async function GET(request: NextRequest) {
  const parsed = ordersQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()))
  if (!parsed.success) return NextResponse.json({ error: 'Paramètres de liste invalides' }, { status: 400 })
  const { cursor, limit, status, query, event } = parsed.data

  let decodedCursor: ReturnType<typeof decodeOrdersCursor> | null = null
  if (cursor) {
    try {
      decodedCursor = decodeOrdersCursor(cursor)
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Cursor invalide' }, { status: 400 })
    }
  }

  try {
    const auth = await requireAdminOrganization(request)
    if (!auth.ok) return auth.response
    const admin = supabaseAdmin()

    if (event) {
      const { data: owned, error: ownedError } = await admin.from('events').select('id').eq('id', event).eq('organization_id', auth.organizationId).maybeSingle()
      if (ownedError) throw ownedError
      if (!owned) return NextResponse.json({ error: 'Événement inaccessible' }, { status: 403 })
    }

    // An event filter keeps only the orders that hold a bib of that event.
    let ordersQuery = event
      ? admin.from('orders').select(`${COLUMNS}, registrations!inner(event_id)`, { count: 'exact' }).eq('registrations.event_id', event)
      : admin.from('orders').select(COLUMNS, { count: 'exact' })
    if (status) ordersQuery = ordersQuery.eq('status', status)

    const term = query ? sanitizeSearchTerm(query) : ''
    if (term) {
      const clauses = [`email.ilike.%${term}%`, `provider_order_id.ilike.%${term}%`]
      if (UUID.test(term)) clauses.push(`id.eq.${term}`)
      ordersQuery = ordersQuery.or(clauses.join(','))
    }
    if (decodedCursor) {
      ordersQuery = ordersQuery.or(keysetAfterFilter(decodedCursor))
    }

    const { data, error, count } = await ordersQuery
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1)
    if (error) throw error

    const rows = (data ?? []) as unknown as OrderRow[]
    const hasNext = rows.length > limit
    const orders = rows.slice(0, limit)
    const orderIds = orders.map((order) => order.id)

    const { data: registrationRows, error: registrationsError } = orderIds.length
      ? await admin.from('registrations').select('id, order_id, cancelled_at, event:events(title)').in('order_id', orderIds)
      : { data: [], error: null }
    if (registrationsError) throw registrationsError
    const registrations = (registrationRows ?? []) as unknown as OrderRegistrationRow[]

    const { data: refundRows, error: refundsError } = registrations.length
      ? await admin.from('ticket_refunds').select('registration_id, amount_cents').eq('status', 'succeeded').in('registration_id', registrations.map((registration) => registration.id))
      : { data: [], error: null }
    if (refundsError) throw refundsError

    const last = orders.at(-1)
    return NextResponse.json({
      orders: summarizeOrders({ orders, registrations, refunds: (refundRows ?? []) as Array<{ registration_id: string; amount_cents: number }> }),
      page: {
        limit,
        totalCount: count ?? 0,
        nextCursor: hasNext && last ? encodeOrdersCursor({ createdAt: last.created_at, id: last.id }) : null,
      },
    })
  } catch (error) {
    console.error('[admin orders] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
