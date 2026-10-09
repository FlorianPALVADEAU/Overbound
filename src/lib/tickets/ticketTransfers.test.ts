import { describe, expect, it, vi } from 'vitest'
import {
  TicketTransferError,
  confirmTransferCheckout,
  consumeTransfer,
  startTransferCheckout,
  unlockTransferFromCheckout,
  type CompletedCheckoutSession,
} from './ticketTransfers'

type Result = { data?: unknown; error?: unknown }

/** Chainable Supabase stand-in: every query resolves to the response registered for `table.operation`. */
const fakeAdmin = (responses: Record<string, Result>) => {
  const calls: Array<{ table: string; op: string; payload?: unknown }> = []
  const admin = {
    from(table: string) {
      let op = 'select'
      const resolve = () => Promise.resolve({ data: null, error: null, ...(responses[`${table}.${op}`] ?? {}) })
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => builder,
        in: () => builder,
        maybeSingle: () => resolve(),
        update: (payload: unknown) => ((op = 'update'), calls.push({ table, op, payload }), builder),
        delete: () => ((op = 'delete'), calls.push({ table, op }), builder),
        insert: (payload: unknown) => ((op = 'insert'), calls.push({ table, op, payload }), resolve()),
        then: (onFulfilled: (value: unknown) => unknown) => resolve().then(onFulfilled),
      }
      return builder
    },
  }
  return { admin: admin as never, calls }
}

const NOW = new Date('2026-09-01T10:00:00Z')
const registration = (overrides: Record<string, unknown> = {}) => ({
  id: 'reg1',
  user_id: 'u1',
  checked_in: false,
  transfer_token: 'tok',
  event: { title: 'Ultra Arena', date: '2026-09-12T06:00:00Z' },
  ...overrides,
})

const stripeMock = () => ({
  checkout: { sessions: { create: vi.fn().mockResolvedValue({ id: 'cs_1', url: 'https://checkout.stripe.test/cs_1' }) } },
})

const start = (responses: Record<string, Result>, stripe = stripeMock(), userId = 'u1') => {
  const { admin, calls } = fakeAdmin(responses)
  return {
    stripe,
    calls,
    run: () =>
      startTransferCheckout({ admin, stripe, userId, userEmail: 'me@x.com', registrationId: 'reg1', origin: 'https://site.test', consentedAt: NOW, now: NOW }),
  }
}

describe('startTransferCheckout', () => {
  it('opens a 6,99 € checkout and records the pending transfer', async () => {
    const { run, stripe, calls } = start({ 'registrations.select': { data: registration() }, 'ticket_transfers.select': { data: [] } })
    await expect(run()).resolves.toEqual({ alreadyUnlocked: false, url: 'https://checkout.stripe.test/cs_1' })

    const params = stripe.checkout.sessions.create.mock.calls[0]![0] as { line_items: Array<{ price_data: { unit_amount: number; currency: string } }>; metadata: Record<string, string> }
    expect(params.line_items[0]?.price_data).toMatchObject({ unit_amount: 699, currency: 'eur' })
    expect(params.metadata).toMatchObject({
      type: 'ticket_transfer',
      registration_id: 'reg1',
      user_id: 'u1',
      withdrawal_waived_at: NOW.toISOString(),
      terms_accepted_at: NOW.toISOString(),
    })
    expect(calls.find((call) => call.op === 'insert')?.payload).toMatchObject({ status: 'pending', amount_cents: 699, stripe_session_id: 'cs_1' })
  })

  it('does not charge twice when the transfer is already unlocked', async () => {
    const { run, stripe } = start({ 'registrations.select': { data: registration() }, 'ticket_transfers.select': { data: [{ registration_id: 'reg1' }] } })
    await expect(run()).resolves.toEqual({ alreadyUnlocked: true })
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it.each([
    ['someone else’s bib', { user_id: 'other' }, 'NOT_OWNER'],
    ['a checked-in bib', { checked_in: true }, 'CHECKED_IN'],
    ['a bib without transfer token', { transfer_token: null }, 'NO_TOKEN'],
    ['after the J-1 deadline', { event: { title: 'X', date: '2026-09-01T20:00:00Z' } }, 'DEADLINE_PASSED'],
  ])('refuses %s', async (_label, override, code) => {
    const { run, stripe } = start({ 'registrations.select': { data: registration(override) } })
    await expect(run()).rejects.toMatchObject({ code })
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it('refuses an unknown registration and reports Stripe failures without recording anything', async () => {
    await expect(start({ 'registrations.select': { data: null } }).run()).rejects.toBeInstanceOf(TicketTransferError)

    const failing = { checkout: { sessions: { create: vi.fn().mockRejectedValue(new Error('stripe down')) } } }
    const { run, calls } = start({ 'registrations.select': { data: registration() }, 'ticket_transfers.select': { data: [] } }, failing as never)
    await expect(run()).rejects.toMatchObject({ code: 'CHECKOUT_FAILED' })
    expect(calls.some((call) => call.op === 'insert')).toBe(false)
  })
})

const paidSession = (overrides: Partial<CompletedCheckoutSession> = {}): CompletedCheckoutSession => ({
  id: 'cs_1',
  payment_status: 'paid',
  amount_total: 699,
  currency: 'eur',
  payment_intent: 'pi_1',
  metadata: { type: 'ticket_transfer', registration_id: 'reg1', user_id: 'u1' },
  ...overrides,
})

describe('unlockTransferFromCheckout', () => {
  it('unlocks the pending transfer once paid', async () => {
    const { admin, calls } = fakeAdmin({ 'ticket_transfers.update': { data: [{ id: 't1' }] } })
    await expect(unlockTransferFromCheckout(admin, paidSession())).resolves.toBe('unlocked')
    expect(calls.find((call) => call.op === 'update')?.payload).toMatchObject({ status: 'paid', stripe_payment_intent_id: 'pi_1' })
  })

  it('is idempotent when Stripe redelivers the event', async () => {
    const { admin } = fakeAdmin({ 'ticket_transfers.update': { data: [] }, 'ticket_transfers.select': { data: { id: 't1' } } })
    await expect(unlockTransferFromCheckout(admin, paidSession())).resolves.toBe('already_unlocked')
  })

  it('records a paid session whose pending row went missing', async () => {
    const { admin, calls } = fakeAdmin({ 'ticket_transfers.update': { data: [] }, 'ticket_transfers.select': { data: null } })
    await expect(unlockTransferFromCheckout(admin, paidSession())).resolves.toBe('unlocked')
    expect(calls.find((call) => call.op === 'insert')?.payload).toMatchObject({ status: 'paid', registration_id: 'reg1' })
  })

  it.each([
    ['unpaid', { payment_status: 'unpaid' }],
    ['wrong amount', { amount_total: 100 }],
    ['wrong currency', { currency: 'usd' }],
    ['another kind of checkout', { metadata: { type: 'other' } }],
    ['no metadata', { metadata: null }],
  ])('ignores %s sessions', async (_label, override) => {
    const { admin, calls } = fakeAdmin({})
    await expect(unlockTransferFromCheckout(admin, paidSession(override as Partial<CompletedCheckoutSession>))).resolves.toBe('ignored')
    expect(calls).toHaveLength(0)
  })
})

describe('consumeTransfer', () => {
  it('marks a paid transfer as claimed', async () => {
    const { admin, calls } = fakeAdmin({ 'ticket_transfers.update': { data: [{ id: 't1' }] } })
    await expect(consumeTransfer(admin, 'reg1', 'u2')).resolves.toBe(true)
    expect(calls[0]?.payload).toMatchObject({ status: 'claimed', claimed_by: 'u2' })
  })

  it('returns false when nothing paid was waiting', async () => {
    const { admin } = fakeAdmin({ 'ticket_transfers.update': { data: [] } })
    await expect(consumeTransfer(admin, 'reg1', 'u2')).resolves.toBe(false)
  })
})

describe('confirmTransferCheckout', () => {
  const confirm = (session: Partial<CompletedCheckoutSession> | Error, responses: Record<string, Result> = { 'ticket_transfers.update': { data: [{ id: 't1' }] } }) => {
    const { admin, calls } = fakeAdmin(responses)
    const retrieve = session instanceof Error ? vi.fn().mockRejectedValue(session) : vi.fn().mockResolvedValue(paidSession(session))
    return { calls, run: (userId = 'u1') => confirmTransferCheckout({ admin, stripe: { checkout: { sessions: { retrieve } } }, userId, sessionId: 'cs_1' }) }
  }

  it('unlocks right away when the payer comes back with a paid session', async () => {
    const { run, calls } = confirm({})
    await expect(run()).resolves.toBe('unlocked')
    expect(calls.find((call) => call.op === 'update')?.payload).toMatchObject({ status: 'paid' })
  })

  it('refuses someone else’s session, a foreign checkout and an unknown session', async () => {
    await expect(confirm({}).run('intruder')).rejects.toMatchObject({ code: 'NOT_OWNER' })
    await expect(confirm({ metadata: { type: 'other', user_id: 'u1' } }).run()).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(confirm(new Error('no such session')).run()).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('does not unlock an unpaid session', async () => {
    const { run, calls } = confirm({ payment_status: 'unpaid' })
    await expect(run()).resolves.toBe('ignored')
    expect(calls).toHaveLength(0)
  })
})
