import { resolveTicketOperationsProfile } from '@/lib/tickets/operationsProfile'

export interface OverviewRegistration {
  id: string
  event_id: string | null
  order_id: string | null
  ticket_id: string | null
  created_at: string
  checked_in: boolean
  cancelled_at: string | null
  wave_index: number | null
}
export interface OverviewOrder {
  id: string
  status: string | null
  amount_total: number | null
  currency: string | null
  created_at: string
}
export interface OverviewRefund {
  registration_id: string
  amount_cents: number
}
export interface OverviewTicket {
  id: string
  name: string | null
  operations_config: Record<string, unknown> | null
}
export interface OverviewEvent {
  id: string
  title: string
  date: string
  location: string | null
  capacity: number | null
}
export interface OverviewWave {
  event_id: string
  wave_index: number
  capacity: number
  assigned_count: number
  is_closed: boolean
}

export interface OverviewInputs {
  now: Date
  scopeEventId: string | null
  events: OverviewEvent[]
  registrations: OverviewRegistration[]
  /** Orders behind the registrations above. */
  orders: OverviewOrder[]
  /** Refunds that went through, for the registrations above. */
  refunds: OverviewRefund[]
  tickets: OverviewTicket[]
  waves: OverviewWave[]
  /** Counted separately: they do not hang off a registration. */
  counts: { stalePendingOrders: number; failedRefunds: number; newQuotes: number }
}

export type OverviewTodoTone = 'danger' | 'warning' | 'info'
export interface OverviewTodo {
  id: string
  tone: OverviewTodoTone
  label: string
  count: number
  href: string
}

export interface AdminOverviewData {
  scope: { eventId: string; title: string } | null
  kpis: {
    revenueCents: number
    refundedCents: number
    currency: string
    registrations: number
    cancelled: number
    checkedIn: number
    capacity: number | null
    fillRate: number | null
    checkInRate: number | null
  }
  trend: { last7Days: number; previous7Days: number }
  salesByDay: Array<{ date: string; registrations: number; revenueCents: number }>
  tickets: Array<{ id: string; name: string; count: number }>
  nextEvent: { id: string; title: string; date: string; location: string | null; registrations: number; capacity: number | null } | null
  todo: OverviewTodo[]
}

const DAY = 24 * 60 * 60 * 1000
export const SALES_WINDOW_DAYS = 30
/** A wave this full is worth a look before it closes the sale on its own. */
export const WAVE_ALMOST_FULL_RATIO = 0.9

const parisDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' })
/** `YYYY-MM-DD` in the event's time zone, so a late-evening sale lands on the right day. */
export const parisDayKey = (value: Date | string) => parisDay.format(typeof value === 'string' ? new Date(value) : value)

const plural = (count: number, singular: string, pluralForm: string) => (count > 1 ? pluralForm : singular)

export function buildAdminOverview(input: OverviewInputs): AdminOverviewData {
  const { now, scopeEventId } = input
  const scopedEvents = scopeEventId ? input.events.filter((event) => event.id === scopeEventId) : input.events
  const eventIds = new Set(scopedEvents.map((event) => event.id))
  const registrations = input.registrations.filter((registration) => registration.event_id && eventIds.has(registration.event_id))
  const active = registrations.filter((registration) => !registration.cancelled_at)

  // Revenue: each paid order once, however many bibs it holds, minus refunds that went through.
  const orderIds = new Set(registrations.map((registration) => registration.order_id).filter((id): id is string => Boolean(id)))
  const paidOrders = input.orders.filter((order) => orderIds.has(order.id) && order.status === 'paid' && typeof order.amount_total === 'number')
  const revenueGross = paidOrders.reduce((total, order) => total + (order.amount_total ?? 0), 0)
  const registrationIds = new Set(registrations.map((registration) => registration.id))
  const refundedCents = input.refunds
    .filter((refund) => registrationIds.has(refund.registration_id))
    .reduce((total, refund) => total + refund.amount_cents, 0)
  const currency = (paidOrders.find((order) => order.currency)?.currency ?? 'eur').toLowerCase()

  const capacity = scopedEvents.reduce<number | null>((total, event) => (event.capacity ? (total ?? 0) + event.capacity : total), null)
  const checkedIn = active.filter((registration) => registration.checked_in).length

  // Sales, day by day, over the last SALES_WINDOW_DAYS days including today.
  const days = new Map<string, { registrations: number; revenueCents: number }>()
  for (let offset = SALES_WINDOW_DAYS - 1; offset >= 0; offset -= 1) {
    days.set(parisDayKey(new Date(now.getTime() - offset * DAY)), { registrations: 0, revenueCents: 0 })
  }
  for (const registration of active) {
    const day = days.get(parisDayKey(registration.created_at))
    if (day) day.registrations += 1
  }
  for (const order of paidOrders) {
    const day = days.get(parisDayKey(order.created_at))
    if (day) day.revenueCents += order.amount_total ?? 0
  }

  const since = (days: number) => now.getTime() - days * DAY
  const last7Days = active.filter((registration) => new Date(registration.created_at).getTime() > since(7)).length
  const previous7Days = active.filter((registration) => {
    const at = new Date(registration.created_at).getTime()
    return at <= since(7) && at > since(14)
  }).length

  const ticketNames = new Map(input.tickets.map((ticket) => [ticket.id, ticket.name ?? 'Billet']))
  const byTicket = new Map<string, number>()
  for (const registration of active) {
    if (registration.ticket_id) byTicket.set(registration.ticket_id, (byTicket.get(registration.ticket_id) ?? 0) + 1)
  }

  const nextEvent = scopeEventId
    ? scopedEvents[0]
    : [...input.events].filter((event) => new Date(event.date).getTime() >= now.getTime()).sort((left, right) => left.date.localeCompare(right.date))[0]

  // Things that need a person: each carries the page where it gets fixed.
  const participantsHref = (eventId: string | null, query = '') =>
    eventId ? `/dashboard/events/${eventId}/participants${query}` : '/dashboard/participants'
  const todo: OverviewTodo[] = []
  if (input.counts.failedRefunds > 0) {
    todo.push({
      id: 'failed-refunds',
      tone: 'danger',
      label: `${plural(input.counts.failedRefunds, 'remboursement en échec', 'remboursements en échec')} à reprendre`,
      count: input.counts.failedRefunds,
      href: '/dashboard/orders',
    })
  }
  if (input.counts.stalePendingOrders > 0) {
    todo.push({
      id: 'stale-pending-orders',
      tone: 'warning',
      label: `${plural(input.counts.stalePendingOrders, 'paiement', 'paiements')} en attente depuis plus de 2 h`,
      count: input.counts.stalePendingOrders,
      href: '/dashboard/orders?status=pending',
    })
  }

  const needsWave = (ticketId: string | null) => {
    const ticket = input.tickets.find((candidate) => candidate.id === ticketId)
    return ticket ? resolveTicketOperationsProfile(ticket.operations_config).departureMode === 'wave' : false
  }
  const withoutWave = active.filter((registration) => registration.wave_index === null && needsWave(registration.ticket_id))
  if (withoutWave.length > 0) {
    todo.push({
      id: 'missing-wave',
      tone: 'danger',
      label: `${plural(withoutWave.length, 'inscription', 'inscriptions')} sans SAS alors que le billet en exige un`,
      count: withoutWave.length,
      href: participantsHref(scopeEventId ?? withoutWave[0].event_id, '?wave=none&status=active'),
    })
  }

  const almostFull = input.waves.filter(
    (wave) => eventIds.has(wave.event_id) && !wave.is_closed && wave.capacity > 0 && wave.assigned_count / wave.capacity >= WAVE_ALMOST_FULL_RATIO,
  )
  if (almostFull.length > 0) {
    todo.push({
      id: 'waves-almost-full',
      tone: 'warning',
      label: `${plural(almostFull.length, 'SAS rempli', 'SAS remplis')} à 90 % ou plus`,
      count: almostFull.length,
      href: participantsHref(scopeEventId ?? almostFull[0].event_id),
    })
  }

  if (input.counts.newQuotes > 0) {
    todo.push({
      id: 'new-quotes',
      tone: 'info',
      label: `${plural(input.counts.newQuotes, 'demande de devis entreprise', 'demandes de devis entreprise')} à traiter`,
      count: input.counts.newQuotes,
      href: '/dashboard/b2b-quotes',
    })
  }

  return {
    scope: scopeEventId && scopedEvents[0] ? { eventId: scopeEventId, title: scopedEvents[0].title } : null,
    kpis: {
      revenueCents: revenueGross - refundedCents,
      refundedCents,
      currency,
      registrations: active.length,
      cancelled: registrations.length - active.length,
      checkedIn,
      capacity,
      fillRate: capacity ? active.length / capacity : null,
      checkInRate: active.length > 0 ? checkedIn / active.length : null,
    },
    trend: { last7Days, previous7Days },
    salesByDay: [...days.entries()].map(([date, value]) => ({ date, ...value })),
    tickets: [...byTicket.entries()]
      .map(([id, count]) => ({ id, name: ticketNames.get(id) ?? 'Billet', count }))
      .sort((left, right) => right.count - left.count),
    nextEvent: nextEvent
      ? {
          id: nextEvent.id,
          title: nextEvent.title,
          date: nextEvent.date,
          location: nextEvent.location,
          registrations: active.filter((registration) => registration.event_id === nextEvent.id).length,
          capacity: nextEvent.capacity,
        }
      : null,
    todo,
  }
}
