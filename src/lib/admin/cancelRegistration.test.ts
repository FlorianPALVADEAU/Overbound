import { describe, expect, it, vi } from 'vitest'
import { AdminCancelError, cancelRegistrationAsAdmin, resolveRefundCents } from './cancelRegistration'

const registrationRow = (patch: Record<string, unknown> = {}) => ({
  id: 'reg-1',
  checked_in: false,
  cancelled_at: null,
  paid_ticket_cents: 5500,
  stripe_payment_intent_id: 'pi_123',
  event: { title: 'Overbound' },
  order: { currency: 'eur' },
  ...patch,
})

const buildAdmin = (
  row: unknown,
  options: { reserveError?: unknown; cancelError?: unknown; companions?: Array<Record<string, unknown>> } = {},
) => {
  const refundUpdates: Array<Record<string, unknown>> = []
  const inserted: Array<Record<string, unknown>> = []
  const rpc = vi.fn(async () => ({ data: { already_cancelled: false }, error: options.cancelError ?? null }))
  const from = vi.fn((table: string) => {
    if (table === 'registrations') {
      return {
        select: () => ({
          eq: (column: string) =>
            column === 'companion_of'
              ? Promise.resolve({ data: options.companions ?? [], error: null })
              : { maybeSingle: async () => ({ data: row, error: null }) },
        }),
      }
    }
    return {
      insert: (value: Record<string, unknown>) => {
        inserted.push(value)
        return {
          select: () => ({
            single: async () =>
              options.reserveError ? { data: null, error: options.reserveError } : { data: { id: 'refund-1' }, error: null },
          }),
        }
      },
      update: (patch: Record<string, unknown>) => ({
        eq: async () => {
          refundUpdates.push(patch)
          return { error: null }
        },
      }),
    }
  })
  return { admin: { from, rpc } as never, rpc, refundUpdates, inserted }
}

const stripeReturning = (impl: () => Promise<{ id: string }>) => ({ refunds: { create: vi.fn(impl) } })
const base = { adminUserId: 'admin-1', registrationId: 'reg-1', reason: 'Doublon' }

describe('resolveRefundCents', () => {
  it('refunds nothing when the admin chose no refund, even if money was paid', () => {
    expect(resolveRefundCents({ mode: 'none' }, 5500)).toBe(0)
  })

  it('refunds the whole ticket price', () => {
    expect(resolveRefundCents({ mode: 'ticket' }, 5500)).toBe(5500)
  })

  it('accepts a partial amount', () => {
    expect(resolveRefundCents({ mode: 'custom', amountCents: 2000 }, 5500)).toBe(2000)
  })

  it('rejects an amount above what was paid', () => {
    expect(() => resolveRefundCents({ mode: 'custom', amountCents: 6000 }, 5500)).toThrowError(AdminCancelError)
  })

  it('rejects a refund when nothing refundable is recorded', () => {
    expect(() => resolveRefundCents({ mode: 'ticket' }, 0)).toThrowError(/Aucun montant remboursable/)
  })
})

describe('cancelRegistrationAsAdmin', () => {
  it('refunds on the original payment, then cancels the bib with the reason', async () => {
    const { admin, rpc, refundUpdates, inserted } = buildAdmin(registrationRow())
    const stripe = stripeReturning(async () => ({ id: 're_1' }))

    const result = await cancelRegistrationAsAdmin({ ...base, admin, stripe, refund: { mode: 'ticket' } })

    expect(result).toEqual({ refundedCents: 5500, currency: 'eur' })
    expect(inserted[0]).toMatchObject({ reason: 'admin', admin_user_id: 'admin-1', amount_cents: 5500, note: 'Doublon' })
    expect(stripe.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: 'pi_123', amount: 5500, metadata: expect.objectContaining({ requested_by: 'admin' }) }),
      { idempotencyKey: 'admin-refund-refund-1' },
    )
    expect(refundUpdates.at(-1)).toMatchObject({ status: 'succeeded', stripe_refund_id: 're_1' })
    expect(rpc).toHaveBeenCalledWith('admin_cancel_registration', { p_registration_id: 'reg-1', p_reason: 'Doublon' })
  })

  it('adds the live OPEN companion price to the refundable amount', async () => {
    const { admin } = buildAdmin(registrationRow(), {
      companions: [
        { paid_ticket_cents: 2900, cancelled_at: null, checked_in: false },
        { paid_ticket_cents: 1000, cancelled_at: '2027-01-01T00:00:00Z', checked_in: false },
      ],
    })
    const stripe = stripeReturning(async () => ({ id: 're_1' }))
    const result = await cancelRegistrationAsAdmin({ ...base, admin, stripe, refund: { mode: 'ticket' } })
    expect(result.refundedCents).toBe(8400)
  })

  it('cancels without touching Stripe when no refund is chosen', async () => {
    const { admin, rpc } = buildAdmin(registrationRow())
    const stripe = stripeReturning(async () => ({ id: 're_1' }))
    const result = await cancelRegistrationAsAdmin({ ...base, admin, stripe, refund: { mode: 'none' } })
    expect(result.refundedCents).toBe(0)
    expect(stripe.refunds.create).not.toHaveBeenCalled()
    expect(rpc).toHaveBeenCalledTimes(1)
  })

  it('requires a reason', async () => {
    const { admin } = buildAdmin(registrationRow())
    const stripe = stripeReturning(async () => ({ id: 're_1' }))
    await expect(
      cancelRegistrationAsAdmin({ ...base, reason: '  ', admin, stripe, refund: { mode: 'none' } }),
    ).rejects.toMatchObject({ code: 'REASON_REQUIRED' })
  })

  it('refuses a registration that is already cancelled', async () => {
    const { admin } = buildAdmin(registrationRow({ cancelled_at: '2027-01-01T00:00:00Z' }))
    const stripe = stripeReturning(async () => ({ id: 're_1' }))
    await expect(
      cancelRegistrationAsAdmin({ ...base, admin, stripe, refund: { mode: 'ticket' } }),
    ).rejects.toMatchObject({ code: 'ALREADY_CANCELLED' })
    expect(stripe.refunds.create).not.toHaveBeenCalled()
  })

  it('refuses a checked-in participant before any refund', async () => {
    const { admin } = buildAdmin(registrationRow({ checked_in: true }))
    const stripe = stripeReturning(async () => ({ id: 're_1' }))
    await expect(
      cancelRegistrationAsAdmin({ ...base, admin, stripe, refund: { mode: 'ticket' } }),
    ).rejects.toMatchObject({ code: 'CHECKED_IN' })
    expect(stripe.refunds.create).not.toHaveBeenCalled()
  })

  it('does not cancel when Stripe refuses the refund', async () => {
    const { admin, rpc, refundUpdates } = buildAdmin(registrationRow())
    const stripe = stripeReturning(async () => {
      throw new Error('card_declined')
    })
    await expect(
      cancelRegistrationAsAdmin({ ...base, admin, stripe, refund: { mode: 'ticket' } }),
    ).rejects.toMatchObject({ code: 'REFUND_FAILED' })
    expect(rpc).not.toHaveBeenCalled()
    expect(refundUpdates.at(-1)).toMatchObject({ status: 'failed' })
  })

  it('reports a refund already in progress', async () => {
    const { admin } = buildAdmin(registrationRow(), { reserveError: { code: '23505' } })
    const stripe = stripeReturning(async () => ({ id: 're_1' }))
    await expect(
      cancelRegistrationAsAdmin({ ...base, admin, stripe, refund: { mode: 'ticket' } }),
    ).rejects.toMatchObject({ code: 'IN_PROGRESS' })
    expect(stripe.refunds.create).not.toHaveBeenCalled()
  })

  it('says so when the refund went out but the cancellation failed', async () => {
    const { admin } = buildAdmin(registrationRow(), { cancelError: { message: 'boom' } })
    const stripe = stripeReturning(async () => ({ id: 're_1' }))
    await expect(
      cancelRegistrationAsAdmin({ ...base, admin, stripe, refund: { mode: 'ticket' } }),
    ).rejects.toMatchObject({ code: 'CANCEL_AFTER_REFUND_FAILED' })
  })

  it('does not refund a free order', async () => {
    const { admin } = buildAdmin(registrationRow({ stripe_payment_intent_id: 'free_abc', paid_ticket_cents: 0 }))
    const stripe = stripeReturning(async () => ({ id: 're_1' }))
    await expect(
      cancelRegistrationAsAdmin({ ...base, admin, stripe, refund: { mode: 'ticket' } }),
    ).rejects.toMatchObject({ code: 'NOTHING_REFUNDABLE' })
  })
})
