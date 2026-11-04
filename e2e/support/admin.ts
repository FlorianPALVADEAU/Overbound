import type { Page, Route } from '@playwright/test'
import { signInLocally } from './ambassador'
import { disableAutomaticPopups } from './popups'

// The back-office pages call only same-origin /api routes. A spec answers every one of them with fixed
// data held in memory, so a run touches no database, no Stripe and no mail provider.

export const EVENT_ID = '11111111-1111-4111-8111-111111111111'
export const OTHER_EVENT_ID = '22222222-2222-4222-8222-222222222222'
const RANKED_TICKET = '33333333-3333-4333-8333-333333333333'
const OPEN_TICKET = '44444444-4444-4444-8444-444444444444'

interface Participant {
  id: string
  participant: { name: string | null; email: string; accountStatus: 'claimed' | 'guest' }
  registration: {
    claimStatus: string | null
    approvalStatus: string | null
    checkedIn: boolean
    cancelledAt: string | null
    cancellationReason: string | null
    bibNumber: number | null
    paidTicketCents: number | null
    createdAt: string
  }
  ticket: { id: string; name: string; operations: { status: 'configured'; departureMode: 'wave' | 'fixed' } }
  departure: { startTime: string | null; waveIndex: number | null }
  group: string | null
  payment: { orderId: string; status: string; amountCents: number; currency: string }
}

const participant = (index: number, overrides: Partial<Participant> = {}): Participant => {
  const open = index % 2 === 0
  return {
    id: `aaaaaaaa-0000-4000-8000-${String(index).padStart(12, '0')}`,
    participant: { name: `Participant ${index}`, email: `participant${index}@example.com`, accountStatus: 'claimed' },
    registration: {
      claimStatus: 'claimed',
      approvalStatus: 'approved',
      checkedIn: index % 5 === 0,
      cancelledAt: null,
      cancellationReason: null,
      bibNumber: 100 + index,
      paidTicketCents: open ? 4500 : 7500,
      createdAt: `2026-10-${String((index % 28) + 1).padStart(2, '0')}T10:00:00.000Z`,
    },
    ticket: open
      ? { id: OPEN_TICKET, name: 'OPEN', operations: { status: 'configured', departureMode: 'wave' } }
      : { id: RANKED_TICKET, name: 'RANKED', operations: { status: 'configured', departureMode: 'fixed' } },
    departure: open
      ? { startTime: '2027-09-12T10:30:00.000Z', waveIndex: 3 }
      : { startTime: '2027-09-12T06:00:00.000Z', waveIndex: null },
    group: index % 3 === 0 ? 'Equipe Acme' : null,
    payment: { orderId: `order-${index}`, status: 'paid', amountCents: open ? 4500 : 7500, currency: 'eur' },
    ...overrides,
  }
}

const logs = Array.from({ length: 120 }, (_, index) => ({
  id: `bbbbbbbb-0000-4000-8000-${String(index).padStart(12, '0')}`,
  created_at: new Date(Date.UTC(2026, 10, 3, 12, 0, 0) - index * 60_000).toISOString(),
  method: ['POST', 'PATCH', 'DELETE', 'PUT'][index % 4],
  path: `/api/admin/some/very/long/path/that/must/not/be/truncated/${index}/with/a/segment/after/another`,
  query_params: index % 3 === 0 ? { event: EVENT_ID } : null,
  body: index % 2 === 0 ? { note: `payload ${index}` } : null,
  user_id: 'admin-1',
  user_email: 'admin@example.com',
  status_code: index % 7 === 0 ? 500 : 200,
  duration_ms: 40 + index,
  ip_address: '203.0.113.7',
  action_type: 'Mise à jour admin',
  summary: `Action numéro ${index} avec un résumé volontairement très long pour vérifier qu'il n'est pas rogné dans la liste`,
  metadata: null,
  error_message: index % 7 === 0 ? 'Erreur serveur simulée' : null,
}))

export interface AdminStubState {
  participants: Participant[]
  logs: typeof logs
  rewards: Array<Record<string, unknown>>
  /** Bodies received by write routes, by `METHOD path`. */
  writes: Array<{ route: string; body: unknown }>
  /** API paths nobody stubbed: a spec asserts this stays empty. */
  unstubbed: string[]
  /** Query strings received by the participants list, most recent last. */
  participantQueries: string[]
}

const event = (id: string, title: string) => ({
  id,
  slug: title.toLowerCase().replace(/\s+/g, '-'),
  title,
  date: '2027-09-12T06:00:00.000Z',
  location: 'Saint-Quentin-en-Yvelines',
  capacity: 400,
  status: 'published',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  registrations_count: 7,
  volunteer_applications_count: 2,
})

const orders = Array.from({ length: 8 }, (_, index) => ({
  id: `cccccccc-0000-4000-8000-${String(index).padStart(12, '0')}`,
  email: `buyer${index}@example.com`,
  status: ['paid', 'pending', 'refunded', 'cancelled'][index % 4],
  amountCents: 4500 + index * 100,
  currency: 'eur',
  createdAt: `2026-11-0${(index % 3) + 1}T09:00:00.000Z`,
  provider: 'stripe',
  providerOrderId: `pi_test_${index}`,
  invoiceUrl: null,
  registrations: 1 + (index % 2),
  cancelledRegistrations: index % 4 === 2 ? 1 : 0,
  refundedCents: index % 4 === 2 ? 4500 : 0,
  events: ['Ultra Arena 2027'],
  stripeUrl: `https://dashboard.stripe.com/test/payments/pi_test_${index}`,
  canResendReceipt: true,
}))

const overview = {
  scope: { eventId: EVENT_ID, title: 'Ultra Arena 2027' },
  kpis: {
    revenueCents: 1234500,
    refundedCents: 22500,
    currency: 'eur',
    registrations: 187,
    cancelled: 6,
    checkedIn: 0,
    capacity: 400,
    fillRate: 0.4675,
    checkInRate: 0,
  },
  trend: { last7Days: 24, previous7Days: 18 },
  salesByDay: Array.from({ length: 30 }, (_, index) => ({
    date: new Date(Date.UTC(2026, 9, 5 + index)).toISOString().slice(0, 10),
    registrations: (index * 7) % 9,
    revenueCents: ((index * 7) % 9) * 5500,
  })),
  tickets: [
    { id: OPEN_TICKET, name: 'OPEN', count: 120 },
    { id: RANKED_TICKET, name: 'RANKED', count: 67 },
  ],
  nextEvent: { id: EVENT_ID, title: 'Ultra Arena 2027', date: '2027-09-12T06:00:00.000Z', location: 'Saint-Quentin-en-Yvelines', registrations: 187, capacity: 400 },
  todo: [
    { id: 'failed-refunds', tone: 'danger', label: 'Remboursement en échec à reprendre', count: 1, href: '/dashboard/orders?status=refunded' },
    { id: 'stale-pending-orders', tone: 'warning', label: 'Paiements en attente depuis plus de 2 h', count: 3, href: '/dashboard/orders?status=pending' },
    { id: 'waves-almost-full', tone: 'info', label: 'SAS presque pleins', count: 2, href: `/dashboard/events/${EVENT_ID}/tickets` },
  ],
}

const rankingRow = (index: number) => ({
  ambassador_id: `dddddddd-0000-4000-8000-${String(index).padStart(12, '0')}`,
  profile_id: `eeeeeeee-0000-4000-8000-${String(index).padStart(12, '0')}`,
  ambassador_name: `Ambassadeur ${index}`,
  ambassador_code: `AMB${index}`,
  is_active: true,
  total_points: 40 - index,
  recruits_open: 20 - index,
  recruits_ranked: 10,
})

/** Ambassador number from its id: the mock keeps the number in the last twelve digits. */
const ambassadorIndexOf = (ambassadorId: string) => Number(ambassadorId.slice(-12))

const LEVEL_NAMES = ['Badge', 'Code -50 %', 'T-shirt', 'Dossard Open'] as const

const reward = (ambassadorIndex: number, level: number, status: string) => ({
  id: `ffffffff-0000-4000-8000-${String(ambassadorIndex * 10 + level).padStart(12, '0')}`,
  ambassador_id: rankingRow(ambassadorIndex).ambassador_id,
  reward_level: level,
  reward_name: LEVEL_NAMES[level - 1],
  points_required: level * 2,
  status,
  program_year: 2027,
  earned_at: '2026-11-01T10:00:00.000Z',
  expires_at: '2027-12-31T22:59:59.000Z',
  is_expired: false,
  claimed_at: status === 'claimed' || status === 'fulfilled' ? '2026-11-02T10:00:00.000Z' : null,
  fulfilled_at: status === 'fulfilled' ? '2026-11-03T10:00:00.000Z' : null,
  cancelled_at: status === 'cancelled' ? '2026-11-02T10:00:00.000Z' : null,
  cancellation_reason: status === 'cancelled' ? 'Inscription remboursée' : null,
})

/** The list rows, with the rewards waiting on the ambassador and on the team counted from the same state the writes change. */
const ambassadorRows = (state: AdminStubState) =>
  Array.from({ length: 30 }, (_, index) => {
    const id = rankingRow(index + 1).ambassador_id
    const own = state.rewards.filter((item) => item.ambassador_id === id)
    return {
      ...rankingRow(index + 1),
      rewards_to_claim: own.filter((item) => item.status === 'earned').length,
      rewards_to_fulfil: own.filter((item) => item.status === 'claimed').length,
    }
  })

const sheetFor = (state: AdminStubState, ambassadorId: string) => {
  const index = ambassadorIndexOf(ambassadorId)
  const own = state.rewards.filter((item) => item.ambassador_id === ambassadorId)
  return {
    ambassador: { id: ambassadorId, profile_id: rankingRow(index).profile_id, name: `Ambassadeur ${index}`, code: `AMB${index}`, is_active: true },
    program_year: 2027,
    current_season: 2027,
    available_program_years: [2027],
    season: { total_points: 39, recruits_open: 19, recruits_ranked: 10 },
    next_reward: null,
    ladder: [1, 2, 3, 4].map((level) => ({
      level,
      name: LEVEL_NAMES[level - 1],
      kind: 'perk',
      points_required: level * 2,
      state: 'reached',
      reward: own.find((item) => item.reward_level === level) ?? null,
    })),
    bonus: null,
    bonus_rewards: [],
  }
}

const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, json: body })

/** Signs in as an admin and answers the whole back-office API from memory. */
export const stubAdminApis = async (page: Page): Promise<AdminStubState> => {
  const state: AdminStubState = {
    participants: Array.from({ length: 60 }, (_, index) => participant(index + 1)),
    logs,
    rewards: [reward(1, 1, 'earned'), reward(1, 2, 'claimed'), reward(1, 3, 'cancelled'), reward(1, 4, 'earned')],
    writes: [],
    unstubbed: [],
    participantQueries: [],
  }
  state.participants[2] = participant(3, {
    registration: { ...participant(3).registration, cancelledAt: '2026-11-01T10:00:00.000Z', cancellationReason: 'Blessure' },
  })

  await signInLocally(page, 'admin@example.com', 'admin-1')
  await disableAutomaticPopups(page)
  await page.addInitScript(() => {
    window.localStorage.setItem('overbound-consent', JSON.stringify({ analytics: false, marketing: false, updatedAt: new Date().toISOString() }))
  })
  await page.route('**/api/session', (route) =>
    json(route, { user: { id: 'admin-1', email: 'admin@example.com' }, profile: { full_name: 'Admin Test', role: 'admin' }, alerts: null }),
  )

  await page.route('**/api/admin/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace(/^\/api\/admin/, '')
    const method = request.method()
    if (method !== 'GET') state.writes.push({ route: `${method} ${path}`, body: request.postDataJSON() })

    if (method === 'GET' && path === '/events') {
      return json(route, { events: [event(EVENT_ID, 'Ultra Arena 2027'), event(OTHER_EVENT_ID, 'Bootcamp Printemps')], page: { limit: 50, totalCount: 2, nextCursor: null } })
    }
    if (method === 'GET' && path === '/maintenance') return json(route, { enabled: false, message: null })
    if (method === 'GET' && path === '/overview') return json(route, { overview: overview })
    if (method === 'GET' && path === '/registrations/upsells-summary') {
      return json(route, { summary: [{ name: 'T-shirt', quantity: 12, total_cents: 24000, currency: 'eur', specs_breakdown: [{ label: 'M', quantity: 7 }] }] })
    }
    if (method === 'GET' && /^\/events\/[^/]+$/.test(path)) {
      return json(route, {
        event: event(path.split('/')[2], 'Ultra Arena 2027'),
        stats: { registrations: { total: 60, approved: 58, pending: 2, checked_in: 12 }, volunteers: { total: 2 }, revenue: { total_cents: 345000, currency: 'eur' } },
      })
    }
    if (method === 'GET' && path === '/b2b-quotes') return json(route, { items: [], nextCursor: null, total: 0 })

    if (method === 'GET' && /^\/events\/[^/]+\/participants\/options$/.test(path)) {
      return json(route, {
        tickets: [{ id: OPEN_TICKET, name: 'OPEN' }, { id: RANKED_TICKET, name: 'RANKED' }],
        waves: [{ waveIndex: 3, startTime: '2027-09-12T10:30:00.000Z' }, { waveIndex: 4, startTime: '2027-09-12T10:40:00.000Z' }],
      })
    }
    if (method === 'GET' && /^\/events\/[^/]+\/participants$/.test(path)) {
      state.participantQueries.push(url.search)
      const query = (url.searchParams.get('query') ?? '').toLowerCase()
      const status = url.searchParams.get('status') ?? 'all'
      const limit = Number(url.searchParams.get('limit') ?? 50)
      const offset = Number(url.searchParams.get('cursor') ?? 0)
      const rows = state.participants.filter((row) => {
        if (status === 'active' && row.registration.cancelledAt) return false
        if (status === 'cancelled' && !row.registration.cancelledAt) return false
        if (!query) return true
        return `${row.participant.email} ${row.participant.name ?? ''}`.toLowerCase().includes(query)
      })
      const page = rows.slice(offset, offset + limit)
      return json(route, {
        participants: page,
        page: { limit, totalCount: rows.length, nextCursor: offset + limit < rows.length ? String(offset + limit) : null },
      })
    }
    if (method === 'POST' && /^\/registrations\/[^/]+\/cancel$/.test(path)) {
      const id = path.split('/')[2]
      const body = request.postDataJSON() as { reason: string; refund: { mode: string; amountCents?: number } }
      const row = state.participants.find((item) => item.id === id)
      if (row) {
        row.registration.cancelledAt = '2026-11-03T10:00:00.000Z'
        row.registration.cancellationReason = body.reason
      }
      const refunded = body.refund.mode === 'ticket' ? row?.registration.paidTicketCents ?? 0 : body.refund.mode === 'custom' ? body.refund.amountCents ?? 0 : 0
      return json(route, { refundedCents: refunded, currency: 'eur' })
    }
    if (method === 'POST' && /^\/registrations\/[^/]+\/resend-ticket$/.test(path)) {
      const row = state.participants.find((item) => item.id === path.split('/')[2])
      return json(route, { to: row?.participant.email ?? 'unknown@example.com' })
    }

    if (method === 'GET' && path === '/orders') {
      const status = url.searchParams.get('status')
      const rows = status ? orders.filter((order) => order.status === status) : orders
      return json(route, { orders: rows, page: { limit: 50, totalCount: rows.length, nextCursor: null } })
    }

    if (method === 'GET' && path === '/logs') {
      const limit = Number(url.searchParams.get('limit') ?? 100)
      const offset = Number(url.searchParams.get('cursor') ?? 0)
      const methodFilter = url.searchParams.get('method')
      const rows = methodFilter ? state.logs.filter((log) => log.method === methodFilter) : state.logs
      return json(route, {
        logs: rows.slice(offset, offset + limit),
        page: { limit, totalCount: rows.length, nextCursor: offset + limit < rows.length ? String(offset + limit) : null },
      })
    }

    if (method === 'GET' && path === '/ambassadors') {
      return json(route, { ambassadors: ambassadorRows(state), program_year: 2027, available_program_years: [2027] })
    }
    if (method === 'GET' && path === '/ambassadors/promo-codes') return json(route, { codes: [] })
    if (method === 'GET' && /^\/ambassadors\/[^/]+$/.test(path)) {
      return json(route, sheetFor(state, path.split('/')[2]))
    }
    if (method === 'GET' && /^\/ambassadors\/[^/]+\/referrals$/.test(path)) return json(route, { referrals: [] })
    if (method === 'GET' && /^\/ambassadors\/[^/]+\/history$/.test(path)) {
      return json(route, { point_adjustments: [], reward_decisions: [] })
    }
    if (method === 'GET' && /^\/ambassadors\/[^/]+\/promo-codes$/.test(path)) return json(route, { codes: [] })
    if (method === 'PATCH' && /^\/ambassador-rewards\/[^/]+$/.test(path)) {
      const id = path.split('/')[2]
      const body = request.postDataJSON() as { status?: string; action?: string }
      const target = state.rewards.find((item) => item.id === id)
      if (target) target.status = body.action === 'cancelled' ? 'cancelled' : body.action === 'reopened' ? 'earned' : body.status
      return json(route, { reward: target })
    }

    state.unstubbed.push(`${method} ${path}`)
    return json(route, { error: 'unstubbed in e2e' }, 404)
  })

  return state
}
