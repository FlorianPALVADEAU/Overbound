import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const {
  constructEventMock,
  checkoutSessionsListMock,
  chargesRetrieveMock,
  supabaseAdminMock,
  sendTicketEmailMock,
  sendReceiptEmailMock,
  notifyAmbassadorRewardsForOrderMock,
  sendAdminPushNotificationMock,
  generateAndUploadQRCodeMock,
  sendMetaCapiEventMock,
  markResendContactAsRegisteredMock,
  assignOpenWaveToRegistrationMock,
} = vi.hoisted(() => ({
  constructEventMock: vi.fn(),
  checkoutSessionsListMock: vi.fn(),
  chargesRetrieveMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  sendTicketEmailMock: vi.fn(),
  sendReceiptEmailMock: vi.fn(),
  notifyAmbassadorRewardsForOrderMock: vi.fn(),
  sendAdminPushNotificationMock: vi.fn(),
  generateAndUploadQRCodeMock: vi.fn(),
  sendMetaCapiEventMock: vi.fn(),
  markResendContactAsRegisteredMock: vi.fn(),
  assignOpenWaveToRegistrationMock: vi.fn(),
}))

vi.mock('stripe', () => ({
  default: class StripeMock {
    webhooks = { constructEvent: constructEventMock }
    checkout = { sessions: { list: checkoutSessionsListMock } }
    charges = { retrieve: chargesRetrieveMock }
  },
}))

vi.mock('@/lib/supabase/server', () => ({
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

vi.mock('@/lib/qrcode/upload', () => ({
  generateAndUploadQRCode: generateAndUploadQRCodeMock,
}))

vi.mock('@/lib/analytics/metaCapi', () => ({
  sendMetaCapiEvent: sendMetaCapiEventMock,
}))

vi.mock('@/lib/email/resendAudiences', () => ({
  markResendContactAsRegistered: markResendContactAsRegisteredMock,
}))

vi.mock('@/lib/openSas', async () => {
  const actual = await vi.importActual<typeof import('@/lib/openSas')>('@/lib/openSas')
  return {
    ...actual,
    assignOpenWaveToRegistration: assignOpenWaveToRegistrationMock,
  }
})

process.env.STRIPE_SECRET_KEY = 'sk_test_xxx'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_xxx'

import { POST } from './route'

const EVENT_ROW = {
  id: 'event-1',
  title: 'Ultra Arena',
  slug: 'ultra-arena',
  location: 'SQY',
  date: '2026-09-12T06:00:00.000Z',
}

const RANKED_TICKET_ROW = {
  id: 'ticket-1',
  name: 'Fury RANKED',
  race: { name: 'Fury' },
  base_price_cents: 5000,
  currency: 'eur',
}

function buildPaymentIntentEvent(metadataOverrides: Record<string, string> = {}) {
  return {
    id: 'evt_1',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_1',
        amount: 5000,
        currency: 'eur',
        receipt_email: null,
        latest_charge: null,
        payment_method_types: ['card'],
        metadata: {
          user_id: 'user-1',
          event_id: 'event-1',
          ticket_id: 'ticket-1',
          participant_email: 'runner@example.com',
          ...metadataOverrides,
        },
      },
    },
  }
}

function createRequest(body = 'raw-body') {
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': 'sig' },
    body,
  }) as unknown as NextRequest
}

function createAdmin(overrides: {
  existingRegistration?: { id: string } | null
  orderError?: { code: string } | null
  registrationInsertError?: Error | null
} = {}) {
  const inserted = { order: null as Record<string, unknown> | null, registration: null as Record<string, unknown> | null }

  return {
    from(table: string) {
      if (table === 'registrations') {
        return {
          select() {
            return {
              eq() {
                return {
                  single: async () => ({ data: overrides.existingRegistration ?? null }),
                }
              },
            }
          },
          insert(payload: Record<string, unknown>) {
            inserted.registration = payload
            return {
              select() {
                return {
                  single: async () =>
                    overrides.registrationInsertError
                      ? { data: null, error: overrides.registrationInsertError }
                      : {
                          data: { id: 'reg-1', email: payload.email, ...payload },
                          error: null,
                        },
                }
              },
            }
          },
          update() {
            return { eq: async () => ({ error: null }) }
          },
        }
      }
      if (table === 'events') {
        return {
          select() {
            return {
              eq() {
                return {
                  single: async () => ({ data: EVENT_ROW, error: null }),
                  maybeSingle: async () => ({ data: { title: EVENT_ROW.title } }),
                }
              },
            }
          },
        }
      }
      if (table === 'tickets') {
        return {
          select() {
            return {
              eq() {
                return {
                  single: async () => ({ data: RANKED_TICKET_ROW, error: null }),
                }
              },
            }
          },
        }
      }
      if (table === 'orders') {
        return {
          insert(payload: Record<string, unknown>) {
            inserted.order = payload
            return {
              select() {
                return {
                  single: async () =>
                    overrides.orderError
                      ? { data: null, error: overrides.orderError }
                      : { data: { id: 'order-1', created_at: '2026-06-01T00:00:00.000Z', ...payload }, error: null },
                }
              },
            }
          },
        }
      }
      if (table === 'promotional_codes') {
        return {
          select() {
            return {
              ilike() {
                return {
                  maybeSingle: async () => ({ data: null, error: null }),
                }
              },
            }
          },
        }
      }
      if (table === 'registration_upsells') {
        return { insert: async () => ({ error: null }) }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
    rpc: async () => ({ error: null }),
  }
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    generateAndUploadQRCodeMock.mockResolvedValue('https://storage.example.com/qr.png')
    sendMetaCapiEventMock.mockResolvedValue(undefined)
    sendAdminPushNotificationMock.mockResolvedValue(undefined)
    markResendContactAsRegisteredMock.mockResolvedValue(undefined)
    notifyAmbassadorRewardsForOrderMock.mockResolvedValue(undefined)
  })

  it('rejects the request when the Stripe signature is invalid', async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error('invalid signature')
    })

    const response = await POST(createRequest())

    expect(response.status).toBe(400)
  })

  it('creates a registration and order for a RANKED ticket, and sends the ticket email', async () => {
    constructEventMock.mockReturnValue(buildPaymentIntentEvent())
    const admin = createAdmin()
    supabaseAdminMock.mockReturnValue(admin)

    const response = await POST(createRequest())

    expect(response.status).toBe(200)
    expect(sendTicketEmailMock).toHaveBeenCalledTimes(1)
    expect(sendTicketEmailMock.mock.calls[0][0]).toMatchObject({
      to: 'runner@example.com',
      eventTitle: EVENT_ROW.title,
      ticketName: RANKED_TICKET_ROW.name,
    })
    expect(sendReceiptEmailMock).toHaveBeenCalledTimes(1)
  })

  it('is idempotent: returns ok without creating a second registration for the same PaymentIntent', async () => {
    constructEventMock.mockReturnValue(buildPaymentIntentEvent())
    const admin = createAdmin({ existingRegistration: { id: 'existing-reg' } })
    supabaseAdminMock.mockReturnValue(admin)

    const response = await POST(createRequest())
    const text = await response.text()

    expect(response.status).toBe(200)
    expect(text).toBe('ok')
    expect(sendTicketEmailMock).not.toHaveBeenCalled()
  })

  it('is idempotent on a concurrent webhook retry: order insert races into a 23505 unique violation', async () => {
    constructEventMock.mockReturnValue(buildPaymentIntentEvent())
    const admin = createAdmin({ orderError: { code: '23505' } })
    supabaseAdminMock.mockReturnValue(admin)

    const response = await POST(createRequest())
    const text = await response.text()

    expect(response.status).toBe(200)
    expect(text).toBe('ok')
    expect(sendTicketEmailMock).not.toHaveBeenCalled()
  })

  it('returns 400 when required metadata (event_id, ticket_id, user_id) is missing', async () => {
    constructEventMock.mockReturnValue(
      buildPaymentIntentEvent({ user_id: '', event_id: '', ticket_id: '' }),
    )

    const response = await POST(createRequest())

    expect(response.status).toBe(400)
  })

  it('skips silently (200) for the multi-registration flow, which is reconciled manually', async () => {
    constructEventMock.mockReturnValue(
      buildPaymentIntentEvent({ registration_flow: 'multi' }),
    )

    const response = await POST(createRequest())
    const text = await response.text()

    expect(response.status).toBe(200)
    expect(text).toBe('ok')
    expect(sendAdminPushNotificationMock).toHaveBeenCalledTimes(1)
  })

  it('returns 200 (ok) and ignores unhandled Stripe event types', async () => {
    constructEventMock.mockReturnValue({ id: 'evt_2', type: 'charge.refunded', data: { object: {} } })

    const response = await POST(createRequest())
    const text = await response.text()

    expect(response.status).toBe(200)
    expect(text).toBe('ok')
  })

  it('returns 500 when registration creation fails after the order was created', async () => {
    constructEventMock.mockReturnValue(buildPaymentIntentEvent())
    const admin = createAdmin({ registrationInsertError: new Error('insert failed') })
    supabaseAdminMock.mockReturnValue(admin)

    const response = await POST(createRequest())

    expect(response.status).toBe(500)
  })
})
