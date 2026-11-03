import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const { constructEventMock, supabaseAdminMock, sendAdminPushNotificationMock, unlockTransferFromCheckoutMock } = vi.hoisted(() => ({
  constructEventMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  sendAdminPushNotificationMock: vi.fn(),
  unlockTransferFromCheckoutMock: vi.fn(),
}))

vi.mock('stripe', () => ({
  default: class StripeMock {
    webhooks = { constructEvent: constructEventMock }
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/push', () => ({
  sendAdminPushNotification: sendAdminPushNotificationMock,
}))

vi.mock('@/lib/tickets/ticketTransfers', async () => {
  const actual = await vi.importActual<typeof import('@/lib/tickets/ticketTransfers')>('@/lib/tickets/ticketTransfers')
  return { ...actual, unlockTransferFromCheckout: unlockTransferFromCheckoutMock }
})

process.env.STRIPE_SECRET_KEY = 'sk_test_xxx'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_xxx'

import { POST } from './route'

function buildPaymentIntentEvent(metadataOverrides: Record<string, string> = {}) {
  return {
    id: 'evt_1',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_1',
        amount: 5000,
        currency: 'eur',
        metadata: {
          user_id: 'user-1',
          event_id: 'event-1',
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

// Only the table-less admin stub the transfer branch needs: registrations are no longer created here.
const createAdmin = () => ({ from: vi.fn() })

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sendAdminPushNotificationMock.mockResolvedValue(undefined)
    supabaseAdminMock.mockReturnValue(createAdmin())
  })

  it('rejects the request when the Stripe signature is invalid', async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error('invalid signature')
    })

    const response = await POST(createRequest())

    expect(response.status).toBe(400)
  })

  it('skips silently (200) for the multi-registration flow, which registrations/create handles', async () => {
    constructEventMock.mockReturnValue(buildPaymentIntentEvent({ registration_flow: 'multi' }))
    const admin = createAdmin()
    supabaseAdminMock.mockReturnValue(admin)

    const response = await POST(createRequest())

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('ok')
    expect(sendAdminPushNotificationMock).toHaveBeenCalledTimes(1)
    expect(admin.from).not.toHaveBeenCalled()
  })

  it('never registers anyone from a single-ticket PaymentIntent, which would skip the age and waiver checks', async () => {
    constructEventMock.mockReturnValue(buildPaymentIntentEvent({ ticket_id: 'ticket-1', participant_email: 'runner@example.com' }))
    const admin = createAdmin()
    supabaseAdminMock.mockReturnValue(admin)

    const response = await POST(createRequest())

    expect(response.status).toBe(200)
    expect(admin.from).not.toHaveBeenCalled()
    expect(sendAdminPushNotificationMock).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining('flux inconnu') }))
  })

  it('returns 200 (ok) and ignores unhandled Stripe event types', async () => {
    constructEventMock.mockReturnValue({ id: 'evt_2', type: 'charge.refunded', data: { object: {} } })

    const response = await POST(createRequest())

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('ok')
  })

  describe('ticket transfer fee', () => {
    const transferSession = { id: 'cs_1', payment_status: 'paid', metadata: { type: 'ticket_transfer', registration_id: 'reg1' } }

    it('unlocks the transfer when its Checkout Session completes', async () => {
      constructEventMock.mockReturnValue({ id: 'evt_t', type: 'checkout.session.completed', data: { object: transferSession } })
      supabaseAdminMock.mockReturnValue(createAdmin())
      unlockTransferFromCheckoutMock.mockResolvedValue('unlocked')

      const response = await POST(createRequest())

      expect(response.status).toBe(200)
      expect(unlockTransferFromCheckoutMock).toHaveBeenCalledWith(expect.anything(), transferSession)
    })

    it('answers 500 so Stripe retries when unlocking fails', async () => {
      constructEventMock.mockReturnValue({ id: 'evt_t', type: 'checkout.session.completed', data: { object: transferSession } })
      supabaseAdminMock.mockReturnValue(createAdmin())
      unlockTransferFromCheckoutMock.mockRejectedValue(new Error('db down'))

      expect((await POST(createRequest())).status).toBe(500)
    })

    it('ignores Checkout Sessions that are not transfers', async () => {
      constructEventMock.mockReturnValue({ id: 'evt_o', type: 'checkout.session.completed', data: { object: { id: 'cs_2', metadata: {} } } })
      supabaseAdminMock.mockReturnValue(createAdmin())

      expect((await POST(createRequest())).status).toBe(200)
      expect(unlockTransferFromCheckoutMock).not.toHaveBeenCalled()
    })

    it('does not treat the fee PaymentIntent as a registration payment', async () => {
      constructEventMock.mockReturnValue(buildPaymentIntentEvent({ type: 'ticket_transfer', user_id: '', event_id: '', ticket_id: '' }))
      const admin = createAdmin()
      const fromSpy = vi.spyOn(admin, 'from')
      supabaseAdminMock.mockReturnValue(admin)

      const response = await POST(createRequest())

      expect(response.status).toBe(200)
      expect(fromSpy).not.toHaveBeenCalled()
    })
  })
})
