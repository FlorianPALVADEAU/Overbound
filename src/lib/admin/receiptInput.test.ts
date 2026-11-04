import { describe, expect, it } from 'vitest'
import { receiptResendSchema } from './receiptInput'

describe('receiptResendSchema', () => {
  it('accepts a Stripe PaymentIntent id', () => {
    const parsed = receiptResendSchema.safeParse({ paymentIntentId: 'pi_3Qabc123XyZ' })

    expect(parsed.success).toBe(true)
  })

  it('refuses a missing id', () => {
    const parsed = receiptResendSchema.safeParse({})

    expect(parsed.success).toBe(false)
  })

  it('refuses an id that is not a PaymentIntent (e.g. a Checkout session id)', () => {
    const parsed = receiptResendSchema.safeParse({ paymentIntentId: 'cs_test_123' })

    expect(parsed.success).toBe(false)
    if (parsed.success) return
    expect(parsed.error.issues[0]?.message).toBe('Identifiant de paiement invalide')
  })

  it('refuses an id with characters outside the Stripe alphabet', () => {
    const parsed = receiptResendSchema.safeParse({ paymentIntentId: 'pi_123/../../x' })

    expect(parsed.success).toBe(false)
  })
})
