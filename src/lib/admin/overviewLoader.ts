import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildAdminOverview,
  type AdminOverviewData,
  type OverviewEvent,
  type OverviewOrder,
  type OverviewRefund,
  type OverviewRegistration,
  type OverviewTicket,
  type OverviewWave,
} from './overview'

type Admin = Pick<SupabaseClient, 'from'>

const PAGE = 1000
/** Far above any event; a runaway table cannot exhaust the function. */
const MAX_REGISTRATIONS = 50_000
const IN_CHUNK = 200
/** A payment still pending after this long is not a customer still typing a card number. */
const STALE_PENDING_MS = 2 * 60 * 60 * 1000

const chunk = <T,>(values: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let index = 0; index < values.length; index += size) chunks.push(values.slice(index, index + size))
  return chunks
}

const unique = (values: Array<string | null>) => [...new Set(values.filter((value): value is string => Boolean(value)))]

/**
 * Reads every registration of the given events, page by page.
 * Refuses to answer past MAX_REGISTRATIONS: a truncated read would yield wrong totals with no signal.
 */
export async function loadRegistrations(admin: Admin, eventIds: string[]): Promise<OverviewRegistration[]> {
  const rows: OverviewRegistration[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from('registrations')
      .select('id, event_id, order_id, ticket_id, created_at, checked_in, cancelled_at, wave_index, sex')
      .in('event_id', eventIds)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw error
    const page = (data ?? []) as OverviewRegistration[]
    rows.push(...page)
    if (page.length < PAGE) return rows
    if (rows.length >= MAX_REGISTRATIONS) {
      throw new Error(`admin overview: plus de ${MAX_REGISTRATIONS} inscriptions, agrégation refusée (tronquée serait fausse)`)
    }
  }
}

const countRows = async (query: PromiseLike<{ count: number | null; error: unknown }>) => {
  const { count, error } = await query
  if (error) {
    console.error('[admin overview] count failed', error)
    return 0
  }
  return count ?? 0
}

/** Reads what the overview needs for the organization's events (or one of them) and builds it. */
export async function loadAdminOverview(
  admin: Admin,
  params: { organizationId: string; eventId: string | null; now?: Date },
): Promise<AdminOverviewData | null> {
  const now = params.now ?? new Date()

  const { data: eventRows, error: eventsError } = await admin
    .from('events')
    .select('id, title, date, location, capacity')
    .eq('organization_id', params.organizationId)
  if (eventsError) throw eventsError
  const events = (eventRows ?? []) as OverviewEvent[]
  if (params.eventId && !events.some((event) => event.id === params.eventId)) return null

  const eventIds = params.eventId ? [params.eventId] : events.map((event) => event.id)
  if (eventIds.length === 0) {
    return buildAdminOverview({
      now, scopeEventId: null, events, registrations: [], orders: [], refunds: [], tickets: [], waves: [],
      counts: { stalePendingOrders: 0, failedRefunds: 0, newQuotes: 0 },
    })
  }

  const registrations = await loadRegistrations(admin, eventIds)
  const orderIds = unique(registrations.map((registration) => registration.order_id))
  const registrationIds = registrations.map((registration) => registration.id)

  const [orderChunks, refundChunks, ticketsResult, wavesResult, stalePendingOrders, failedRefunds, newQuotes] = await Promise.all([
    Promise.all(
      chunk(orderIds, IN_CHUNK).map((ids) =>
        admin.from('orders').select('id, status, amount_total, currency, created_at').in('id', ids),
      ),
    ),
    Promise.all(
      chunk(registrationIds, IN_CHUNK).map((ids) =>
        admin.from('ticket_refunds').select('registration_id, amount_cents').eq('status', 'succeeded').in('registration_id', ids),
      ),
    ),
    admin.from('tickets').select('id, name, operations_config').in('event_id', eventIds),
    admin.from('event_waves').select('event_id, wave_index, capacity, assigned_count, is_closed').in('event_id', eventIds),
    countRows(
      admin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('created_at', new Date(now.getTime() - STALE_PENDING_MS).toISOString()),
    ),
    countRows(admin.from('ticket_refunds').select('id', { count: 'exact', head: true }).eq('status', 'failed')),
    countRows(admin.from('b2b_quote_requests').select('id', { count: 'exact', head: true }).eq('status', 'new')),
  ])

  for (const result of [...orderChunks, ...refundChunks, ticketsResult, wavesResult]) {
    if (result.error) throw result.error
  }

  return buildAdminOverview({
    now,
    scopeEventId: params.eventId,
    events,
    registrations,
    orders: orderChunks.flatMap((result) => (result.data ?? []) as OverviewOrder[]),
    refunds: refundChunks.flatMap((result) => (result.data ?? []) as OverviewRefund[]),
    tickets: (ticketsResult.data ?? []) as OverviewTicket[],
    waves: (wavesResult.data ?? []) as OverviewWave[],
    counts: { stalePendingOrders, failedRefunds, newQuotes },
  })
}
