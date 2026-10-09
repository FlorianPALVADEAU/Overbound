import type { SupabaseClient } from '@supabase/supabase-js'
import {
  TICKET_TRANSFER_CURRENCY,
  TICKET_TRANSFER_FEE_CENTS,
  isTicketTransferAllowed,
} from '@/lib/tickets/transferPolicy'

export type TicketTransferErrorCode = 'NOT_FOUND' | 'NOT_OWNER' | 'CHECKED_IN' | 'NO_TOKEN' | 'DEADLINE_PASSED' | 'CHECKOUT_FAILED'

const STATUS_BY_CODE: Record<TicketTransferErrorCode, number> = {
  NOT_FOUND: 404,
  NOT_OWNER: 403,
  CHECKED_IN: 409,
  NO_TOKEN: 409,
  DEADLINE_PASSED: 410,
  CHECKOUT_FAILED: 502,
}

export class TicketTransferError extends Error {
  readonly status: number
  constructor(readonly code: TicketTransferErrorCode, message: string) {
    super(message)
    this.status = STATUS_BY_CODE[code]
  }
}

/** The slice of the Stripe client this module needs; keeps it testable without the SDK. */
export interface CheckoutSessionCreator {
  checkout: {
    sessions: {
      create(params: Record<string, unknown>): Promise<{ id: string; url: string | null }>
    }
  }
}

/** Reading side of the Stripe client: lets the payer's return trip confirm the payment without the webhook. */
export interface CheckoutSessionReader {
  checkout: { sessions: { retrieve(id: string): Promise<CompletedCheckoutSession> } }
}

export interface CompletedCheckoutSession {
  id: string
  payment_status: string
  amount_total: number | null
  currency: string | null
  payment_intent: string | { id: string } | null
  metadata: Record<string, string> | null
}

export const TICKET_TRANSFER_METADATA_TYPE = 'ticket_transfer'

type Admin = Pick<SupabaseClient, 'from'>

const firstRelation = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

/** Registration ids (among `ids`) whose transfer is paid and still waiting to be claimed. */
export async function listUnlockedRegistrationIds(admin: Admin, ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set()
  const { data, error } = await admin
    .from('ticket_transfers')
    .select('registration_id')
    .in('registration_id', ids)
    .eq('status', 'paid')
  if (error) throw error
  return new Set((data ?? []).map((row) => row.registration_id as string))
}

export async function isTransferUnlocked(admin: Admin, registrationId: string): Promise<boolean> {
  return (await listUnlockedRegistrationIds(admin, [registrationId])).has(registrationId)
}

/**
 * Starts the payment that unlocks a bib transfer. Returns the Stripe Checkout
 * URL, or `alreadyUnlocked` when the fee was already paid for this bib.
 */
export async function startTransferCheckout(params: {
  admin: Admin
  stripe: CheckoutSessionCreator
  userId: string
  userEmail: string | null | undefined
  registrationId: string
  origin: string
  /** When the payer accepted the transfer terms and waived withdrawal for this immediately performed service. */
  consentedAt: Date
  now?: Date
}): Promise<{ alreadyUnlocked: true } | { alreadyUnlocked: false; url: string }> {
  const { admin, stripe, userId, userEmail, registrationId, origin, consentedAt, now = new Date() } = params

  const { data: registration, error } = await admin
    .from('registrations')
    .select('id, user_id, checked_in, transfer_token, event:events(title, date)')
    .eq('id', registrationId)
    .maybeSingle()
  if (error) throw error
  if (!registration) throw new TicketTransferError('NOT_FOUND', 'Billet introuvable.')
  if (registration.user_id !== userId) throw new TicketTransferError('NOT_OWNER', 'Ce billet ne t’appartient pas.')
  if (registration.checked_in) throw new TicketTransferError('CHECKED_IN', 'Ce billet a déjà été validé.')
  if (!registration.transfer_token) throw new TicketTransferError('NO_TOKEN', 'Ce billet ne peut pas être transféré.')

  const event = firstRelation(registration.event as { title: string | null; date: string | null } | Array<{ title: string | null; date: string | null }> | null)
  if (!isTicketTransferAllowed(event?.date, now)) {
    throw new TicketTransferError('DEADLINE_PASSED', 'Le délai de transfert de ce billet est dépassé.')
  }

  if (await isTransferUnlocked(admin, registrationId)) return { alreadyUnlocked: true }

  const metadata = {
    type: TICKET_TRANSFER_METADATA_TYPE,
    registration_id: registrationId,
    user_id: userId,
    // Evidence kept on the Stripe payment: terms accepted and withdrawal waived (art. L221-28 1° C. conso).
    terms_accepted_at: consentedAt.toISOString(),
    withdrawal_waived_at: consentedAt.toISOString(),
  }
  let session: { id: string; url: string | null }
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: userEmail ?? undefined,
      client_reference_id: registrationId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: TICKET_TRANSFER_CURRENCY,
            unit_amount: TICKET_TRANSFER_FEE_CENTS,
            product_data: { name: `Transfert de billet${event?.title ? ` — ${event.title}` : ''}` },
          },
        },
      ],
      metadata,
      // Lets the registration webhook recognise (and skip) this PaymentIntent.
      payment_intent_data: { metadata },
      success_url: `${origin}/account?transfer=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/account?transfer=cancelled`,
    })
  } catch (stripeError) {
    console.error('[ticket transfer] checkout creation failed', stripeError)
    throw new TicketTransferError('CHECKOUT_FAILED', 'Impossible de lancer le paiement. Réessaie dans un instant.')
  }
  if (!session.url) throw new TicketTransferError('CHECKOUT_FAILED', 'Impossible de lancer le paiement. Réessaie dans un instant.')

  // A previous abandoned checkout for the same bib is replaced, never accumulated.
  const { error: cleanupError } = await admin
    .from('ticket_transfers')
    .delete()
    .eq('registration_id', registrationId)
    .eq('status', 'pending')
  if (cleanupError) throw cleanupError

  const { error: insertError } = await admin.from('ticket_transfers').insert({
    registration_id: registrationId,
    payer_user_id: userId,
    stripe_session_id: session.id,
    amount_cents: TICKET_TRANSFER_FEE_CENTS,
    currency: TICKET_TRANSFER_CURRENCY,
    status: 'pending',
  })
  if (insertError) throw insertError

  return { alreadyUnlocked: false, url: session.url }
}

export type TransferPaymentOutcome = 'unlocked' | 'already_unlocked' | 'ignored'

/**
 * Webhook side: a completed Checkout Session unlocks the transfer. Idempotent
 * (Stripe retries) and strict about what counts as a valid payment.
 */
export async function unlockTransferFromCheckout(admin: Admin, session: CompletedCheckoutSession): Promise<TransferPaymentOutcome> {
  const metadata = session.metadata ?? {}
  const registrationId = metadata.registration_id
  const isValid =
    metadata.type === TICKET_TRANSFER_METADATA_TYPE &&
    Boolean(registrationId) &&
    session.payment_status === 'paid' &&
    session.amount_total === TICKET_TRANSFER_FEE_CENTS &&
    session.currency === TICKET_TRANSFER_CURRENCY
  if (!isValid) return 'ignored'

  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null)

  const { data: updated, error } = await admin
    .from('ticket_transfers')
    .update({ status: 'paid', paid_at: new Date().toISOString(), stripe_payment_intent_id: paymentIntentId })
    .eq('stripe_session_id', session.id)
    .eq('status', 'pending')
    .select('id')
  if (error) throw error
  if (updated && updated.length > 0) return 'unlocked'

  const { data: existing, error: existingError } = await admin
    .from('ticket_transfers')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing) return 'already_unlocked'

  // Paid session whose pending row is missing (cleaned up by a later checkout, or an insert failure): trust Stripe.
  const { error: insertError } = await admin.from('ticket_transfers').insert({
    registration_id: registrationId,
    payer_user_id: metadata.user_id,
    stripe_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    amount_cents: TICKET_TRANSFER_FEE_CENTS,
    currency: TICKET_TRANSFER_CURRENCY,
    status: 'paid',
    paid_at: new Date().toISOString(),
  })
  if (insertError) throw insertError
  return 'unlocked'
}

/** Claim side: marks the paid transfer as used. Returns false when no paid transfer was waiting. */
export async function consumeTransfer(admin: Admin, registrationId: string, claimerId: string): Promise<boolean> {
  const { data, error } = await admin
    .from('ticket_transfers')
    .update({ status: 'claimed', claimed_at: new Date().toISOString(), claimed_by: claimerId })
    .eq('registration_id', registrationId)
    .eq('status', 'paid')
    .select('id')
  if (error) throw error
  return (data ?? []).length > 0
}

/**
 * Return-trip confirmation: after paying, the browser comes back with the Checkout
 * Session id and the transfer is unlocked right away, instead of waiting for the
 * webhook (which can lag, or never reach a local environment). Stripe is asked for
 * the session, so the id cannot be forged, and only the payer can confirm it.
 */
export async function confirmTransferCheckout(params: {
  admin: Admin
  stripe: CheckoutSessionReader
  userId: string
  sessionId: string
}): Promise<TransferPaymentOutcome> {
  let session: CompletedCheckoutSession
  try {
    session = await params.stripe.checkout.sessions.retrieve(params.sessionId)
  } catch (error) {
    console.error('[ticket transfer] could not retrieve checkout session', error)
    throw new TicketTransferError('NOT_FOUND', 'Paiement introuvable.')
  }
  if (session.metadata?.type !== TICKET_TRANSFER_METADATA_TYPE) {
    throw new TicketTransferError('NOT_FOUND', 'Paiement introuvable.')
  }
  if (session.metadata.user_id !== params.userId) {
    throw new TicketTransferError('NOT_OWNER', 'Ce paiement ne t’appartient pas.')
  }
  return unlockTransferFromCheckout(params.admin, session)
}
