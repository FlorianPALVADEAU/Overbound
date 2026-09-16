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

function createAdmin(overrides: { existingRegistration?: { id: string } | null } = {}) {
  return {
    from(table: string) {
      if (table === 'events') {
        return {
          select() {
            return { eq() { return { single: async () => ({ data: EVENT_ROW, error: null }) } } }
          },
        }
      }
      if (table === 'tickets') {
        return {
          select() {
            return { in: async () => ({ data: [RANKED_TICKET_ROW], error: null }) }
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
    rpc: async () => ({ error: null }),
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
})
