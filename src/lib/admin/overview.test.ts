import { describe, expect, it } from 'vitest'
import { buildAdminOverview, parisDayKey, type OverviewInputs, type OverviewRegistration } from './overview'

const NOW = new Date('2027-06-15T10:00:00Z')
const EVENT_A = 'event-a'
const EVENT_B = 'event-b'
const WAVE_CONFIG = { departure_mode: 'wave', departure_change_policy: 'reassign' }
const FIXED_CONFIG = { departure_mode: 'fixed', departure_change_policy: 'preserve' }

const registration = (patch: Partial<OverviewRegistration> = {}): OverviewRegistration => ({
  id: `reg-${Math.random()}`,
  event_id: EVENT_A,
  order_id: 'order-1',
  ticket_id: 'ticket-fixed',
  created_at: '2027-06-14T09:00:00Z',
  checked_in: false,
  cancelled_at: null,
  wave_index: null,
  ...patch,
})

const base = (patch: Partial<OverviewInputs> = {}): OverviewInputs => ({
  now: NOW,
  scopeEventId: null,
  events: [
    { id: EVENT_A, title: 'Overbound 2027', date: '2027-09-12T08:00:00Z', location: 'Saint-Quentin', capacity: 100 },
    { id: EVENT_B, title: 'Night Run', date: '2027-11-01T18:00:00Z', location: 'Paris', capacity: 50 },
  ],
  registrations: [],
  orders: [],
  refunds: [],
  tickets: [
    { id: 'ticket-fixed', name: 'Ranked', operations_config: FIXED_CONFIG },
    { id: 'ticket-wave', name: 'Open', operations_config: WAVE_CONFIG },
  ],
  waves: [],
  counts: { stalePendingOrders: 0, failedRefunds: 0, newQuotes: 0 },
  ...patch,
})

describe('buildAdminOverview', () => {
  it('counts a multi-bib order once in the revenue', () => {
    const result = buildAdminOverview(
      base({
        registrations: [registration({ id: 'r1' }), registration({ id: 'r2' })],
        orders: [{ id: 'order-1', status: 'paid', amount_total: 11000, currency: 'eur', created_at: '2027-06-14T09:00:00Z' }],
      }),
    )
    expect(result.kpis.revenueCents).toBe(11000)
    expect(result.kpis.registrations).toBe(2)
  })

  it('ignores unpaid, refunded and cancelled orders', () => {
    const result = buildAdminOverview(
      base({
        registrations: [registration({ order_id: 'o1' }), registration({ order_id: 'o2' }), registration({ order_id: 'o3' })],
        orders: [
          { id: 'o1', status: 'pending', amount_total: 5000, currency: 'eur', created_at: '2027-06-14T09:00:00Z' },
          { id: 'o2', status: 'refunded', amount_total: 5000, currency: 'eur', created_at: '2027-06-14T09:00:00Z' },
          { id: 'o3', status: 'paid', amount_total: 7000, currency: 'eur', created_at: '2027-06-14T09:00:00Z' },
        ],
      }),
    )
    expect(result.kpis.revenueCents).toBe(7000)
  })

  it('subtracts refunds that went through and keeps cancelled bibs out of the active count', () => {
    const result = buildAdminOverview(
      base({
        registrations: [registration({ id: 'r1' }), registration({ id: 'r2', cancelled_at: '2027-06-15T08:00:00Z' })],
        orders: [{ id: 'order-1', status: 'paid', amount_total: 11000, currency: 'eur', created_at: '2027-06-14T09:00:00Z' }],
        refunds: [{ registration_id: 'r2', amount_cents: 5500 }],
      }),
    )
    expect(result.kpis).toMatchObject({ revenueCents: 5500, refundedCents: 5500, registrations: 1, cancelled: 1 })
  })

  it('limits every figure to the selected event', () => {
    const result = buildAdminOverview(
      base({
        scopeEventId: EVENT_B,
        registrations: [registration({ event_id: EVENT_A, order_id: 'oa' }), registration({ event_id: EVENT_B, order_id: 'ob' })],
        orders: [
          { id: 'oa', status: 'paid', amount_total: 9000, currency: 'eur', created_at: '2027-06-14T09:00:00Z' },
          { id: 'ob', status: 'paid', amount_total: 4000, currency: 'eur', created_at: '2027-06-14T09:00:00Z' },
        ],
      }),
    )
    expect(result.scope).toEqual({ eventId: EVENT_B, title: 'Night Run' })
    expect(result.kpis).toMatchObject({ revenueCents: 4000, registrations: 1, capacity: 50, fillRate: 0.02 })
    expect(result.nextEvent).toMatchObject({ id: EVENT_B, registrations: 1 })
  })

  it('without a selection, the next event is the nearest future one', () => {
    expect(buildAdminOverview(base()).nextEvent?.id).toBe(EVENT_A)
  })

  it('measures check-in against active registrations only', () => {
    const result = buildAdminOverview(
      base({
        registrations: [
          registration({ checked_in: true }),
          registration(),
          registration({ cancelled_at: '2027-06-15T08:00:00Z', checked_in: false }),
        ],
      }),
    )
    expect(result.kpis).toMatchObject({ checkedIn: 1, checkInRate: 0.5 })
  })

  it('compares the last seven days with the seven before', () => {
    const result = buildAdminOverview(
      base({
        registrations: [
          registration({ created_at: '2027-06-14T09:00:00Z' }),
          registration({ created_at: '2027-06-10T09:00:00Z' }),
          registration({ created_at: '2027-06-05T09:00:00Z' }),
        ],
      }),
    )
    expect(result.trend).toEqual({ last7Days: 2, previous7Days: 1 })
  })

  it('buckets sales by Paris day over 30 days', () => {
    const result = buildAdminOverview(
      base({
        // 23:30 UTC on the 14th is already the 15th in Paris (summer time).
        registrations: [registration({ created_at: '2027-06-14T23:30:00Z' })],
        orders: [{ id: 'order-1', status: 'paid', amount_total: 5500, currency: 'eur', created_at: '2027-06-14T23:30:00Z' }],
      }),
    )
    expect(result.salesByDay).toHaveLength(30)
    expect(result.salesByDay.at(-1)).toEqual({ date: parisDayKey(NOW), registrations: 1, revenueCents: 5500 })
  })

  it('ranks tickets by registrations', () => {
    const result = buildAdminOverview(
      base({
        registrations: [registration({ ticket_id: 'ticket-wave' }), registration({ ticket_id: 'ticket-wave' }), registration({ ticket_id: 'ticket-fixed' })],
      }),
    )
    expect(result.tickets.map((ticket) => [ticket.name, ticket.count])).toEqual([['Open', 2], ['Ranked', 1]])
  })

  describe('to do', () => {
    it('is empty when nothing needs a person', () => {
      expect(buildAdminOverview(base()).todo).toEqual([])
    })

    it('flags a wave ticket registration that has no SAS, pointing at the filtered list', () => {
      const result = buildAdminOverview(base({ registrations: [registration({ ticket_id: 'ticket-wave', wave_index: null }), registration({ ticket_id: 'ticket-fixed' })] }))
      expect(result.todo).toEqual([
        expect.objectContaining({ id: 'missing-wave', tone: 'danger', count: 1, href: `/dashboard/events/${EVENT_A}/participants?wave=none&status=active` }),
      ])
    })

    it('does not flag a cancelled bib without SAS', () => {
      const result = buildAdminOverview(base({ registrations: [registration({ ticket_id: 'ticket-wave', cancelled_at: '2027-06-15T08:00:00Z' })] }))
      expect(result.todo).toEqual([])
    })

    it('flags waves at 90 % or more, but not closed or smaller ones', () => {
      const result = buildAdminOverview(
        base({
          waves: [
            { event_id: EVENT_A, wave_index: 1, capacity: 50, assigned_count: 45, is_closed: false },
            { event_id: EVENT_A, wave_index: 2, capacity: 50, assigned_count: 44, is_closed: false },
            { event_id: EVENT_A, wave_index: 3, capacity: 50, assigned_count: 50, is_closed: true },
          ],
        }),
      )
      expect(result.todo).toEqual([expect.objectContaining({ id: 'waves-almost-full', count: 1 })])
    })

    it('lists the counted items by urgency: refunds, payments, then quotes', () => {
      const result = buildAdminOverview(base({ counts: { stalePendingOrders: 2, failedRefunds: 1, newQuotes: 3 } }))
      expect(result.todo.map((item) => [item.id, item.tone, item.count])).toEqual([
        ['failed-refunds', 'danger', 1],
        ['stale-pending-orders', 'warning', 2],
        ['new-quotes', 'info', 3],
      ])
    })

    it('uses the singular for a single item', () => {
      const result = buildAdminOverview(base({ counts: { stalePendingOrders: 0, failedRefunds: 0, newQuotes: 1 } }))
      expect(result.todo[0].label).toBe('demande de devis entreprise à traiter')
    })
  })
})
