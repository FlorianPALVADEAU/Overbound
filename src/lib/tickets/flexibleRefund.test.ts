import { describe, expect, it, vi } from 'vitest'
import { refundFlexibleTicket } from './flexibleRefund'

const NOW = new Date('2027-08-01T10:00:00Z')

const registrationRow = (patch: Record<string, unknown> = {}) => ({
  id: 'reg-1',
  user_id: 'buyer',
  guarantor_user_id: null,
  checked_in: false,
  flexible_refund: true,
  paid_ticket_cents: 5500,
  cancelled_at: null,
  stripe_payment_intent_id: 'pi_123',
  event: { title: 'Overbound', date: '2027-09-12T08:00:00Z' },
  order: { user_id: 'buyer', currency: 'eur' },
  ...patch,
})

const buildAdmin = (row: unknown, options: { reserveError?: unknown; cancelError?: unknown } = {}) => {
  const refundUpdates: Array<Record<string, unknown>> = []
  const rpc = vi.fn(async () => ({ data: { already_cancelled: false }, error: options.cancelError ?? null }))
  const from = vi.fn((table: string) => {
    if (table === 'registrations') {
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row, error: null }) }) }) }
    }
    return {
      insert: () => ({
        select: () => ({
          single: async () =>
            options.reserveError ? { data: null, error: options.reserveError } : { data: { id: 'refund-1' }, error: null },
        }),
      }),
      update: (patch: Record<string, unknown>) => ({
        eq: async () => {
          refundUpdates.push(patch)
          return { error: null }
        },
      }),
    }
  })
  return { admin: { from, rpc } as never, rpc, refundUpdates }
}

const stripeReturning = (impl: () => Promise<{ id: string }>) => ({ refunds: { create: vi.fn(impl) } })

describe('refundFlexibleTicket', () => {
  it('refunds the ticket price on the original payment, then cancels the bib', async () => {
    const { admin, rpc, refundUpdates } = buildAdmin(registrationRow())
    const stripe = stripeReturning(async () => ({ id: 're_1' }))

    const result = await refundFlexibleTicket({ admin, stripe, userId: 'buyer', registrationId: 'reg-1', now: NOW })

    expect(result).toMatchObject({ amountCents: 5500, currency: 'eur' })
    expect(stripe.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: 'pi_123',
        amount: 5500,
        reason: 'requested_by_customer',
        metadata: expect.objectContaining({ type: 'flexible_refund', requested_by: 'client', user_id: 'buyer' }),
      }),
      { idempotencyKey: 'flexible-refund-refund-1' },
    )
    expect(refundUpdates.at(-1)).toMatchObject({ status: 'succeeded', stripe_refund_id: 're_1' })
    expect(rpc).toHaveBeenCalledWith('cancel_registration_for_flexible_refund', { p_registration_id: 'reg-1' })
  })

  it('refuses a transferred bib without touching Stripe', async () => {
    const { admin } = buildAdmin(registrationRow({ user_id: 'friend', guarantor_user_id: 'buyer' }))
    const stripe = stripeReturning(async () => ({ id: 're_1' }))
    await expect(
      refundFlexibleTicket({ admin, stripe, userId: 'buyer', registrationId: 'reg-1', now: NOW }),
    ).rejects.toMatchObject({ code: 'TRANSFERRED' })
    expect(stripe.refunds.create).not.toHaveBeenCalled()
  })

  it('reports a refund already in progress', async () => {
    const { admin } = buildAdmin(registrationRow(), { reserveError: { code: '23505' } })
    const stripe = stripeReturning(async () => ({ id: 're_1' }))
    await expect(
      refundFlexibleTicket({ admin, stripe, userId: 'buyer', registrationId: 'reg-1', now: NOW }),
    ).rejects.toMatchObject({ code: 'IN_PROGRESS' })
  })

  it('keeps the bib when Stripe refuses the refund', async () => {
    const { admin, rpc, refundUpdates } = buildAdmin(registrationRow())
    const stripe = stripeReturning(async () => {
      throw new Error('card network down')
    })
    await expect(
      refundFlexibleTicket({ admin, stripe, userId: 'buyer', registrationId: 'reg-1', now: NOW }),
    ).rejects.toMatchObject({ code: 'REFUND_FAILED' })
    expect(refundUpdates.at(-1)).toMatchObject({ status: 'failed' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('surfaces a cancellation failure after the money left', async () => {
    const { admin } = buildAdmin(registrationRow(), { cancelError: { message: 'locked' } })
    const stripe = stripeReturning(async () => ({ id: 're_1' }))
    await expect(
      refundFlexibleTicket({ admin, stripe, userId: 'buyer', registrationId: 'reg-1', now: NOW }),
    ).rejects.toMatchObject({ code: 'CANCEL_FAILED' })
  })
})
