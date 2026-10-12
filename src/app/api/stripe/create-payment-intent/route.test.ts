import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseServerMock, supabaseAdminMock, paymentIntentsCreateMock, sendMetaCapiEventMock } = vi.hoisted(() => ({
  createSupabaseServerMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  paymentIntentsCreateMock: vi.fn(),
  sendMetaCapiEventMock: vi.fn(),
}))

vi.mock('stripe', () => ({
  default: class StripeMock {
    paymentIntents = { create: paymentIntentsCreateMock }
  },
}))
vi.mock('@/lib/supabase/server', () => ({ createSupabaseServer: createSupabaseServerMock, supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/analytics/metaCapi', () => ({ sendMetaCapiEvent: sendMetaCapiEventMock }))
vi.mock('@/lib/sentry', () => ({ captureException: vi.fn() }))

process.env.STRIPE_SECRET_KEY = 'sk_test_xxx'

import { POST } from './route'

const EVENT = {
  id: 'event-1',
  title: 'Ultra Arena',
  date: '2027-09-12T06:00:00.000Z',
  sales_start: null,
  location: 'SQY',
  status: 'on_sale',
  capacity: 1000,
  price_tiers: [] as Array<Record<string, unknown>>,
}

const ticket = (id: string, name: string, price: number) => ({
  id,
  name,
  final_price_cents: price,
  currency: 'eur',
  operations_config: null,
  race: null,
  event: EVENT,
})

const promoRow = (code: string, fields: Record<string, unknown> = {}) => ({
  id: `promo-${code}`,
  code,
  discount_percent: null,
  discount_amount: null,
  currency: 'eur',
  is_active: true,
  valid_from: null,
  valid_until: null,
  usage_limit: null,
  used_count: 0,
  target_upsell_id: null,
  events: [],
  ambassadors: [],
  ...fields,
})

interface Database {
  tickets: ReturnType<typeof ticket>[]
  upsells: Array<{ id: string; type: string; price_cents: number }>
  promos: ReturnType<typeof promoRow>[]
  registrationCount: number
  tierCounts: Array<{ event_price_tier_id: string | null }>
  groups: Array<{ id: string; anchor_event_id: string; anchor_wave_index: number }>
  groupMembers: Array<{ group_id: string; profile_id: string }>
}

/** A Supabase client stand-in: every query resolves to the rows of its table. */
const fakeSupabase = (db: Database, { denyRegistrations = false, denyPromos = false } = {}) => ({
  auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
  from(table: string) {
    let ilikeCode = ''
    let countQuery = false
    let byId = ''
    let byGroup = ''
    let byProfile = ''
    const resolve = () => {
      if (table === 'tickets') return { data: db.tickets, error: null }
      if (table === 'upsells') return { data: byId ? db.upsells.find((u) => u.id === byId) ?? null : db.upsells, error: null }
      if (table === 'promotional_codes') {
        if (denyPromos) return { data: null, error: { code: '42501', message: 'permission denied for table ambassadors' } }
        return { data: db.promos.find((p) => p.code === ilikeCode) ?? null, error: null }
      }
      if (table === 'group_members') {
        return { data: db.groupMembers.find((m) => m.group_id === byGroup && m.profile_id === byProfile) ?? null, error: null }
      }
      if (table === 'groups') return { data: db.groups.find((g) => g.id === byId) ?? null, error: null }
      if (table === 'registrations') {
        if (denyRegistrations) return { data: null, count: null, error: { code: '42501', message: 'permission denied for table registrations' } }
        return countQuery ? { count: db.registrationCount, error: null } : { data: db.tierCounts, error: null }
      }
      return { data: null, error: null }
    }
    const query = {
      select: (_columns: string, options?: { count?: string }) => {
        countQuery = Boolean(options?.count)
        return query
      },
      in: () => query,
      eq: (column: string, value: string) => {
        if (column === 'id') byId = value
        if (column === 'group_id') byGroup = value
        if (column === 'profile_id') byProfile = value
        return query
      },
      is: () => query,
      limit: () => query,
      or: () => query,
      ilike: (_column: string, value: string) => {
        ilikeCode = value
        return query
      },
      maybeSingle: async () => resolve(),
      then: (onFulfilled: (value: unknown) => unknown) => Promise.resolve(resolve()).then(onFulfilled),
    }
    return query
  },
})

const defaultDb = (): Database => ({
  tickets: [ticket('open', 'Primal OPEN', 5000), ticket('ranked', 'Fury RANKED', 7000)],
  upsells: [{ id: 'tshirt', type: 'tshirt', price_cents: 2000 }],
  promos: [],
  registrationCount: 0,
  tierCounts: [],
  groups: [],
  groupMembers: [],
})

const adult = (ticketId: string, selectedWaveIndex: number | null = null, flexible = false) => ({
  ticketId,
  flexible,
  birthDate: '1990-01-01',
  selectedWaveIndex,
})

const body = (overrides: Record<string, unknown> = {}) => ({
  eventId: 'event-1',
  userId: 'user-1',
  userEmail: 'alice@example.com',
  ticketSelections: [{ ticketId: 'open', quantity: 2 }],
  participants: [adult('open', 2), adult('open', 2)],
  upsells: [],
  promoCodes: [],
  ...overrides,
})

const post = (payload: unknown) =>
  POST(
    Object.assign(
      new Request('http://localhost/api/stripe/create-payment-intent', { method: 'POST', body: JSON.stringify(payload) }),
      { cookies: { get: () => undefined } },
    ) as unknown as import('next/server').NextRequest,
  )

const chargedMetadata = () => paymentIntentsCreateMock.mock.calls[0]?.[0]

describe('POST /api/stripe/create-payment-intent', () => {
  let db: Database

  beforeEach(() => {
    vi.clearAllMocks()
    db = defaultDb()
    // A visitor's session cannot read registrations or a code's ambassador link (RLS / grants): those reads must use the admin client.
    createSupabaseServerMock.mockImplementation(async () => fakeSupabase(db, { denyRegistrations: true, denyPromos: true }))
    supabaseAdminMock.mockImplementation(() => fakeSupabase(db))
    paymentIntentsCreateMock.mockResolvedValue({ id: 'pi_1', client_secret: 'secret_1' })
  })

  it('charges the engine total and records each bib price', async () => {
    const response = await post(body())
    expect(response.status).toBe(200)
    expect(chargedMetadata()).toMatchObject({ amount: 10000, metadata: { ticket_prices: '5000,5000', flexible_participants: '' } })
  })

  it('applies -50 % to what a free OPEN ticket left to pay (2 × 50 € = 25 €)', async () => {
    db.promos = [
      promoRow('FREEOPENTICKET', { discount_percent: 100 }),
      promoRow('AMBHALF', { discount_percent: 50, ambassadors: [{ id: 'amb-1' }] }),
    ]
    const response = await post(body({ promoCodes: ['FREEOPENTICKET'], ambassadorReferralCode: 'AMBHALF' }))
    const json = await response.json()
    expect(json.pricing).toMatchObject({ totalDue: 2500, discountAmount: 7500 })
    expect(chargedMetadata()).toMatchObject({
      amount: 2500,
      metadata: { ambassador_referral_code: 'AMBHALF', promo_code: 'FREEOPENTICKET', ticket_prices: '1250,1250' },
    })
  })

  it('returns a free order without calling Stripe when nothing is left to pay', async () => {
    db.promos = [promoRow('FREE', { discount_percent: 100 })]
    const response = await post(body({ promoCodes: ['FREE'] }))
    const json = await response.json()
    expect(json).toMatchObject({ freeOrder: true, pricing: { totalDue: 0 } })
    expect(paymentIntentsCreateMock).not.toHaveBeenCalled()
  })

  it('charges the flexible option on an otherwise free order', async () => {
    db.promos = [promoRow('FREE', { discount_percent: 100 })]
    await post(body({ promoCodes: ['FREE'], participants: [adult('open', 2, true), adult('open', 2)] }))
    expect(chargedMetadata()).toMatchObject({ amount: 890, metadata: { flexible_participants: '0' } })
  })

  it('spills participants onto the next tier when the active one is almost full', async () => {
    EVENT.price_tiers = [
      { id: 'early', discount_percentage: 20, available_from: null, available_until: null, display_order: 1, max_registrations: 3 },
      { id: 'late', discount_percentage: 0, available_from: null, available_until: null, display_order: 2, max_registrations: null },
    ]
    db.tierCounts = [{ event_price_tier_id: 'early' }, { event_price_tier_id: 'early' }]
    await post(body())
    EVENT.price_tiers = []
    expect(chargedMetadata()).toMatchObject({
      amount: 9000,
      metadata: { tier_allocations: JSON.stringify([{ tier_id: 'early', quantity: 1 }, { tier_id: 'late', quantity: 1 }]) },
    })
  })

  it('refuses an OPEN ticket code on a RANKED-only order', async () => {
    db.promos = [promoRow('FREEOPENTICKET', { discount_percent: 100 })]
    const response = await post(
      body({ ticketSelections: [{ ticketId: 'ranked', quantity: 1 }], participants: [adult('ranked')], promoCodes: ['FREEOPENTICKET'] }),
    )
    expect(response.status).toBe(409)
    expect(paymentIntentsCreateMock).not.toHaveBeenCalled()
  })

  it('refuses two ticket codes', async () => {
    db.promos = [promoRow('SUMMER', { discount_percent: 10 }), promoRow('WINTER', { discount_percent: 20 })]
    const response = await post(body({ promoCodes: ['SUMMER', 'WINTER'] }))
    expect(response.status).toBe(409)
  })

  it('refuses an expired code', async () => {
    db.promos = [promoRow('OLD', { discount_percent: 10, valid_until: '2020-01-01T00:00:00Z' })]
    const response = await post(body({ promoCodes: ['OLD'] }))
    expect(response.status).toBe(409)
  })

  it('refuses a third code before reading the database', async () => {
    const response = await post(body({ promoCodes: ['A', 'B', 'C'] }))
    expect(response.status).toBe(400)
  })

  it('refuses an order without any ticket', async () => {
    const response = await post(body({ ticketSelections: [{ ticketId: 'open', quantity: 0 }], participants: [] }))
    expect(response.status).toBe(400)
  })

  it('refuses a participant under 18 before charging', async () => {
    const response = await post(body({ participants: [adult('open', 2), { ...adult('open', 2), birthDate: '2015-01-01' }] }))
    expect(response.status).toBe(422)
    expect(paymentIntentsCreateMock).not.toHaveBeenCalled()
  })

  it('refuses an OPEN participant without SAS before charging', async () => {
    const response = await post(body({ participants: [adult('open', 2), adult('open')] }))
    expect(response.status).toBe(422)
    expect((await response.json()).error).toContain('SAS')
  })

  it('does not let a visitor skip the SAS with the id of a group they do not belong to', async () => {
    db.groups = [{ id: 'group-1', anchor_event_id: 'event-1', anchor_wave_index: 4 }]
    const response = await post(body({ groupId: 'group-1', participants: [adult('open'), adult('open')] }))
    expect(response.status).toBe(422)
    expect((await response.json()).error).toContain('SAS')
  })

  it('lets a member of an anchored group skip the SAS', async () => {
    db.groups = [{ id: 'group-1', anchor_event_id: 'event-1', anchor_wave_index: 4 }]
    db.groupMembers = [{ group_id: 'group-1', profile_id: 'user-1' }]
    const response = await post(body({ groupId: 'group-1', participants: [adult('open'), adult('open')] }))
    expect(response.status).toBe(200)
  })

  it('refuses an order larger than the seats left', async () => {
    db.registrationCount = 999
    const response = await post(body())
    expect(response.status).toBe(409)
  })
})
