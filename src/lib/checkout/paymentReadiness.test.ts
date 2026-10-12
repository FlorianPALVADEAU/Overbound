import { describe, expect, it } from 'vitest'
import { checkPaymentReadiness } from './paymentReadiness'
import { signedDraft } from './testDraft'

const withPayment = (overrides = {}) => ({ ...signedDraft(), clientSecret: 'secret', paymentIntentId: 'pi_1', ...overrides })

describe('checkPaymentReadiness', () => {
  it('is ready for a signed draft with its PaymentIntent', () => {
    expect(checkPaymentReadiness(withPayment(), 'event-1').ready).toBe(true)
  })

  it('blocks without draft, for another event, or before sign-in', () => {
    expect(checkPaymentReadiness(null, 'event-1')).toEqual({ ready: false, block: 'NO_DRAFT' })
    expect(checkPaymentReadiness(withPayment(), 'event-2')).toEqual({ ready: false, block: 'NO_DRAFT' })
    expect(checkPaymentReadiness(withPayment({ userId: null }), 'event-1')).toEqual({ ready: false, block: 'NO_DRAFT' })
  })

  it('blocks when the PaymentIntent is gone', () => {
    expect(checkPaymentReadiness(withPayment({ clientSecret: null }), 'event-1')).toEqual({ ready: false, block: 'NO_PAYMENT_INTENT' })
  })

  it('blocks when the waiver was not signed and accepted', () => {
    const unsigned = withPayment({ signature: { imageDataUrl: '', regulationVersion: 'v1', signedAt: null } })
    expect(checkPaymentReadiness(unsigned, 'event-1')).toEqual({ ready: false, block: 'NOT_SIGNED' })
    const notAccepted = withPayment({ disclaimer: { read: true, accepted: false, rulebookAccepted: true } })
    expect(checkPaymentReadiness(notAccepted, 'event-1')).toEqual({ ready: false, block: 'NOT_SIGNED' })
  })
})
