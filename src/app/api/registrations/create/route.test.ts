import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createSupabaseServerMock,
  supabaseAdminMock,
  paymentIntentsRetrieveMock,
  sendTicketEmailMock,
  sendReceiptEmailMock,
  notifyAmbassadorRewardsForOrderMock,
  sendAdminPushNotificationMock,
  sendMetaCapiEventMock,
  markResendContactAsRegisteredMock,
  qrCodeToDataURLMock,
} = vi.hoisted(() => ({
  createSupabaseServerMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  paymentIntentsRetrieveMock: vi.fn(),
  sendTicketEmailMock: vi.fn(),
  sendReceiptEmailMock: vi.fn(),
  notifyAmbassadorRewardsForOrderMock: vi.fn(),
  sendAdminPushNotificationMock: vi.fn(),
  sendMetaCapiEventMock: vi.fn(),
  markResendContactAsRegisteredMock: vi.fn(),
  qrCodeToDataURLMock: vi.fn(),
}))

vi.mock('stripe', () => ({
  default: class StripeMock {
    paymentIntents = { retrieve: paymentIntentsRetrieveMock }
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: createSupabaseServerMock,
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/email', () => ({
  sendTicketEmail: sendTicketEmailMock,
  sendReceiptEmail: sendReceiptEmailMock,
}))

vi.mock('@/lib/ambassadors/rewardsNotifications', () => ({
  notifyAmbassadorRewardsForOrder: notifyAmbassadorRewardsForOrderMock,
}))

vi.mock('@/lib/push', () => ({
  sendAdminPushNotification: sendAdminPushNotificationMock,
}))

vi.mock('@/lib/analytics/metaCapi', () => ({
  sendMetaCapiEvent: sendMetaCapiEventMock,
}))

vi.mock('@/lib/email/resendAudiences', () => ({
  markResendContactAsRegistered: markResendContactAsRegisteredMock,
}))

vi.mock('qrcode', () => ({
  toDataURL: qrCodeToDataURLMock,
}))

process.env.STRIPE_SECRET_KEY = 'sk_test_xxx'

import { POST } from './route'

const EVENT_ROW = {
  id: 'event-1',
  title: 'Ultra Arena',
  date: '2026-09-12T06:00:00.000Z',
  location: 'SQY',
  open_bib_capacity: 5000,
  ranked_bib_capacity: 1000,
  price_tiers: [],
}

const RANKED_TICKET_ROW = {
  id: 'ticket-1',
  name: 'Fury RANKED',
  race: { id: 'race-1', name: 'Fury' },
  final_price_cents: 5000,
  base_price_cents: 5000,
  currency: 'eur',
}

const OPEN_TICKET_ROW = {
  id: 'ticket-1',
  name: 'Primal OPEN',
  race: { id: 'race-1', name: 'Primal' },
  final_price_cents: 5000,
  base_price_cents: 5000,
  currency: 'eur',
}

function baseBody(overrides: Record<string, unknown> = {}) {
  return {
    paymentIntentId: 'pi_1',
    eventId: 'event-1',
    userId: 'user-1',
    ticketSelections: [{ ticketId: 'ticket-1', quantity: 1 }],
    participants: [
      {
        ticketId: 'ticket-1',
        firstName: 'Alice',
        lastName: 'Runner',
        email: 'alice@example.com',
      },
    ],
    upsells: [],
    signatureImage: 'data:image/png;base64,abc',
    signatureMetadata: {},
    disclaimer: { read: true, accepted: true, rulebookAccepted: true },
    ...overrides,
  }
}

function jsonRequest(body: unknown) {
  const request = new Request('http://localhost/api/registrations/create', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return Object.assign(request, {
    cookies: { get: () => undefined },
  }) as unknown as import('next/server').NextRequest
}

function mockAuthedUser(userId: string | null) {
  createSupabaseServerMock.mockResolvedValue({
    auth: {
      getUser: async () => ({ data: { user: userId ? { id: userId, email: 'alice@example.com' } : null } }),
    },
    from(table: string) {
      if (table === 'registrations') {
        return {
          select() {
            return {
              or() {
                return { maybeSingle: async () => ({ data: null }) }
              },
            }
          },
        }
      }
      throw new Error(`Unexpected table on user-scoped client: ${table}`)
    },
  })
}

function createAdmin(
  overrides: {
    existingRegistration?: { id: string } | null
    eventOverrides?: Record<string, unknown>
    rpcOverrides?: Record<string, (...args: any[]) => Promise<{ data?: unknown; error: unknown }>>
    ticketRows?: Array<Record<string, unknown>>
    groupRow?: Record<string, unknown> | null
  } = {},
) {
  const eventRow = { ...EVENT_ROW, ...overrides.eventOverrides }
  const ticketRows = overrides.ticketRows ?? [RANKED_TICKET_ROW]

  return {
    from(table: string) {
      if (table === 'events') {
        return {
          select() {
            return { eq() { return { single: async () => ({ data: eventRow, error: null }) } } }
          },
        }
      }
      if (table === 'tickets') {
        return {
          select() {
            return { in: async () => ({ data: ticketRows, error: null }) }
          },
        }
      }
      if (table === 'groups') {
        return {
          select() {
            return {
              eq() {
                return { maybeSingle: async () => ({ data: overrides.groupRow ?? null }) }
              },
            }
          },
          update() {
            return { eq: async () => ({ error: null }) }
          },
        }
      }
      if (table === 'upsells') {
        return {
          select() {
            return { eq() { return { or: async () => ({ data: [], error: null }) } } }
          },
        }
      }
      if (table === 'orders') {
        return {
          insert(payload: Record<string, unknown>) {
            return {
              select() {
                return {
                  single: async () => ({
                    data: { id: 'order-1', created_at: '2026-06-01T00:00:00.000Z', ...payload },
                    error: null,
                  }),
                }
              },
            }
          },
        }
      }
      if (table === 'registrations') {
        return {
          insert(payload: Record<string, unknown>) {
            return {
              select() {
                return {
                  single: async () => ({
                    data: { id: 'reg-1', email: payload.email, ...payload },
                    error: null,
                  }),
                }
              },
            }
          },
          update() {
            return { eq: async () => ({ error: null }) }
          },
        }
      }
      if (table === 'registration_signatures') {
        return { insert: async () => ({ error: null }) }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
    rpc: async (fn: string, args: unknown) => {
      if (overrides.rpcOverrides?.[fn]) return overrides.rpcOverrides[fn](args)
      if (fn === 'assign_bib_number') return { data: 1, error: null }
      if (fn === 'assign_selected_wave_to_registration') {
        return {
          data: { wave_index: 5, start_time: '2026-09-12T10:50:00.000Z', wave_capacity: 50, wave_position: 1 },
          error: null,
        }
      }
      if (fn === 'sync_registration_to_group_anchor') {
        return {
          data: { wave_index: 3, start_time: '2026-09-12T10:30:00.000Z', wave_capacity: 50, wave_position: 2 },
          error: null,
        }
      }
      return { error: null }
    },
  }
}

describe('POST /api/registrations/create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    qrCodeToDataURLMock.mockResolvedValue('data:image/png;base64,qr')
    sendMetaCapiEventMock.mockResolvedValue(undefined)
    sendAdminPushNotificationMock.mockResolvedValue(undefined)
    markResendContactAsRegisteredMock.mockResolvedValue(undefined)
    notifyAmbassadorRewardsForOrderMock.mockResolvedValue(undefined)
  })

  it('returns 400 when required fields are missing', async () => {
    mockAuthedUser('user-1')

    const response = await POST(jsonRequest(baseBody({ eventId: '' })))

    expect(response.status).toBe(400)
  })

  it('returns 422 when the signature or disclaimer acceptance is missing', async () => {
    mockAuthedUser('user-1')

    const response = await POST(
      jsonRequest(baseBody({ disclaimer: { read: true, accepted: false, rulebookAccepted: true } })),
    )

    expect(response.status).toBe(422)
  })

  it('returns 401 when the authenticated user does not match the userId in the body', async () => {
    mockAuthedUser('someone-else')

    const response = await POST(jsonRequest(baseBody()))

    expect(response.status).toBe(401)
  })

  it('returns 409 when a registration already exists for this PaymentIntent', async () => {
    paymentIntentsRetrieveMock.mockResolvedValue({
      id: 'pi_1',
      status: 'succeeded',
      amount: 5000,
      currency: 'eur',
      metadata: {},
      payment_method_types: ['card'],
    })
    createSupabaseServerMock.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'user-1', email: 'alice@example.com' } } }) },
      from(table: string) {
        if (table === 'registrations') {
          return {
            select() {
              return { or() { return { maybeSingle: async () => ({ data: { id: 'existing-reg' } }) } } }
            },
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    })

    const response = await POST(jsonRequest(baseBody()))

    expect(response.status).toBe(409)
  })

  it('returns 400 when the PaymentIntent is not confirmed', async () => {
    mockAuthedUser('user-1')
    paymentIntentsRetrieveMock.mockResolvedValue({ id: 'pi_1', status: 'requires_payment_method' })

    const response = await POST(jsonRequest(baseBody()))

    expect(response.status).toBe(400)
  })

  it('returns 202 (pending) when the PaymentIntent is still processing', async () => {
    mockAuthedUser('user-1')
    paymentIntentsRetrieveMock.mockResolvedValue({ id: 'pi_1', status: 'processing' })

    const response = await POST(jsonRequest(baseBody()))
    const body = await response.json()

    expect(response.status).toBe(202)
    expect(body.pending).toBe(true)
  })

  it('creates a RANKED registration for a free order and sends the ticket email', async () => {
    mockAuthedUser('user-1')
    supabaseAdminMock.mockReturnValue(createAdmin())

    const response = await POST(
      jsonRequest(
        baseBody({
          paymentIntentId: 'free_abc123',
          freeOrderMetadata: { currency: 'eur' },
        }),
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(sendTicketEmailMock).toHaveBeenCalledTimes(1)
    expect(sendTicketEmailMock.mock.calls[0][0]).toMatchObject({
      to: 'alice@example.com',
      eventTitle: EVENT_ROW.title,
      ticketName: RANKED_TICKET_ROW.name,
    })
    // Free orders have no receipt to send (amount is 0).
    expect(paymentIntentsRetrieveMock).not.toHaveBeenCalled()
  })

  it('creates a paid RANKED registration via a confirmed Stripe PaymentIntent', async () => {
    mockAuthedUser('user-1')
    paymentIntentsRetrieveMock.mockResolvedValue({
      id: 'pi_1',
      status: 'succeeded',
      amount: 5000,
      currency: 'eur',
      metadata: {},
      payment_method_types: ['card'],
    })
    supabaseAdminMock.mockReturnValue(createAdmin())

    const response = await POST(jsonRequest(baseBody()))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(sendTicketEmailMock).toHaveBeenCalledTimes(1)
    expect(sendReceiptEmailMock).toHaveBeenCalledTimes(1)
  })

  it('assigns a bib number via the atomic RPC for a RANKED registration', async () => {
    mockAuthedUser('user-1')
    supabaseAdminMock.mockReturnValue(createAdmin())

    const response = await POST(
      jsonRequest(baseBody({ paymentIntentId: 'free_abc123', freeOrderMetadata: { currency: 'eur' } })),
    )

    expect(response.status).toBe(200)
  })

  it('returns 422 without creating a registration when the event has no bib capacity configured', async () => {
    mockAuthedUser('user-1')
    supabaseAdminMock.mockReturnValue(
      createAdmin({
        eventOverrides: { ranked_bib_capacity: null },
      }),
    )

    const response = await POST(
      jsonRequest(baseBody({ paymentIntentId: 'free_abc123', freeOrderMetadata: { currency: 'eur' } })),
    )
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body.error).toMatch(/dossard/i)
  })

  it('assigns the participant-selected SAS OPEN via the atomic RPC', async () => {
    mockAuthedUser('user-1')
    supabaseAdminMock.mockReturnValue(createAdmin({ ticketRows: [OPEN_TICKET_ROW] }))

    const response = await POST(
      jsonRequest(
        baseBody({
          paymentIntentId: 'free_abc123',
          freeOrderMetadata: { currency: 'eur' },
          participants: [
            {
              ticketId: 'ticket-1',
              firstName: 'Alice',
              lastName: 'Runner',
              email: 'alice@example.com',
              distanceIdealKm: '20',
              distanceMinKm: '10',
              selectedWaveIndex: 5,
            },
          ],
        }),
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns 422 when an OPEN participant submits no selectedWaveIndex and has no group anchor', async () => {
    mockAuthedUser('user-1')
    supabaseAdminMock.mockReturnValue(createAdmin({ ticketRows: [OPEN_TICKET_ROW] }))

    const response = await POST(
      jsonRequest(
        baseBody({
          paymentIntentId: 'free_abc123',
          freeOrderMetadata: { currency: 'eur' },
          participants: [
            {
              ticketId: 'ticket-1',
              firstName: 'Alice',
              lastName: 'Runner',
              email: 'alice@example.com',
              distanceIdealKm: '20',
              distanceMinKm: '10',
            },
          ],
        }),
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body.error).toMatch(/SAS_SELECTION_REQUIRED/)
  })

  it('returns 422 when the selected wave is no longer available at confirmation time', async () => {
    mockAuthedUser('user-1')
    supabaseAdminMock.mockReturnValue(
      createAdmin({
        ticketRows: [OPEN_TICKET_ROW],
        rpcOverrides: {
          assign_selected_wave_to_registration: async () => ({
            data: null,
            error: new Error('SELECTED_WAVE_UNAVAILABLE: wave 5 is full'),
          }),
        },
      }),
    )

    const response = await POST(
      jsonRequest(
        baseBody({
          paymentIntentId: 'free_abc123',
          freeOrderMetadata: { currency: 'eur' },
          participants: [
            {
              ticketId: 'ticket-1',
              firstName: 'Alice',
              lastName: 'Runner',
              email: 'alice@example.com',
              distanceIdealKm: '20',
              distanceMinKm: '10',
              selectedWaveIndex: 5,
            },
          ],
        }),
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body.error).toMatch(/SAS choisi indisponible/)
  })

  it('forces a group-anchored member onto the anchor wave, ignoring any submitted selectedWaveIndex', async () => {
    mockAuthedUser('user-1')
    let syncCalledWithWaveIndex: number | null = null
    supabaseAdminMock.mockReturnValue(
      createAdmin({
        ticketRows: [OPEN_TICKET_ROW],
        groupRow: { id: 'group-1', anchor_event_id: 'event-1', anchor_wave_index: 3 },
        rpcOverrides: {
          sync_registration_to_group_anchor: async (args: any) => {
            syncCalledWithWaveIndex = args.p_wave_index
            return {
              data: { wave_index: 3, start_time: '2026-09-12T10:30:00.000Z', wave_capacity: 50, wave_position: 2 },
              error: null,
            }
          },
        },
      }),
    )

    const response = await POST(
      jsonRequest(
        baseBody({
          paymentIntentId: 'free_abc123',
          freeOrderMetadata: { currency: 'eur' },
          groupId: 'group-1',
          participants: [
            {
              ticketId: 'ticket-1',
              firstName: 'Alice',
              lastName: 'Runner',
              email: 'alice@example.com',
              distanceIdealKm: '20',
              distanceMinKm: '10',
              // Deliberately different from the anchor (3) — must be ignored server-side.
              selectedWaveIndex: 9,
            },
          ],
        }),
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(syncCalledWithWaveIndex).toBe(3)
  })

  it('returns 422 when the bib RPC reports capacity exhaustion', async () => {
    mockAuthedUser('user-1')
    supabaseAdminMock.mockReturnValue(
      createAdmin({
        rpcOverrides: {
          assign_bib_number: async () => ({
            data: null,
            error: new Error('BIB_CAPACITY_EXHAUSTED: no bib number available'),
          }),
        },
      }),
    )

    const response = await POST(
      jsonRequest(baseBody({ paymentIntentId: 'free_abc123', freeOrderMetadata: { currency: 'eur' } })),
    )
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body.error).toMatch(/dossard/i)
  })
})
