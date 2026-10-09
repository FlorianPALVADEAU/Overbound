import type { SupabaseClient } from '@supabase/supabase-js'
import {
  FLEXIBLE_REFUND_MESSAGES,
  getFlexibleRefundEligibility,
  type FlexibleRefundBlock,
} from '@/lib/tickets/flexibleTicket'

type Admin = Pick<SupabaseClient, 'from' | 'rpc'>

/** The slice of the Stripe client this module needs; keeps it testable without the SDK. */
export interface RefundCreator {
  refunds: {
    create(
      params: { payment_intent: string; amount: number; reason: 'requested_by_customer'; metadata: Record<string, string> },
      options: { idempotencyKey: string },
    ): Promise<{ id: string }>
  }
}

export type FlexibleRefundErrorCode = FlexibleRefundBlock | 'NOT_FOUND' | 'IN_PROGRESS' | 'REFUND_FAILED' | 'CANCEL_FAILED'

const STATUS_BY_CODE: Record<FlexibleRefundErrorCode, number> = {
  NOT_FOUND: 404,
  NOT_BUYER: 403,
  NOT_FLEXIBLE: 409,
  ALREADY_CANCELLED: 409,
  CHECKED_IN: 409,
  TRANSFERRED: 409,
  NOTHING_PAID: 409,
  IN_PROGRESS: 409,
  DEADLINE_PASSED: 410,
  REFUND_FAILED: 502,
  CANCEL_FAILED: 500,
}

const MESSAGES: Record<FlexibleRefundErrorCode, string> = {
  ...FLEXIBLE_REFUND_MESSAGES,
  NOT_FOUND: 'Billet introuvable.',
  IN_PROGRESS: 'Un remboursement est déjà en cours pour ce billet.',
  REFUND_FAILED: 'Le remboursement n’a pas pu être lancé. Réessaie dans un instant.',
  CANCEL_FAILED: 'Le remboursement est parti, mais l’annulation du billet a échoué : notre équipe s’en occupe.',
}

export class FlexibleRefundError extends Error {
  readonly status: number
  constructor(readonly code: FlexibleRefundErrorCode) {
    super(MESSAGES[code])
    this.status = STATUS_BY_CODE[code]
  }
}

const firstRelation = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

export interface FlexibleRefundResult {
  amountCents: number
  currency: string
  eventTitle: string | null
  eventDate: string | null
}

/**
 * Cancels a "billet flexible" bib and refunds its ticket price on the original
 * payment. Order: reserve a refund row (one live refund per bib), refund on
 * Stripe, then cancel the bib. Money is never kept for a cancelled bib; if the
 * cancellation fails after the refund, the error is surfaced for an admin.
 */
export async function refundFlexibleTicket(params: {
  admin: Admin
  stripe: RefundCreator
  userId: string
  registrationId: string
  now?: Date
}): Promise<FlexibleRefundResult> {
  const { admin, stripe, userId, registrationId, now = new Date() } = params

  const { data: registration, error } = await admin
    .from('registrations')
    .select(
      'id, user_id, guarantor_user_id, checked_in, flexible_refund, paid_ticket_cents, cancelled_at, stripe_payment_intent_id, event:events(title, date), order:orders(user_id, currency)',
    )
    .eq('id', registrationId)
    .maybeSingle()
  if (error) throw error
  if (!registration) throw new FlexibleRefundError('NOT_FOUND')

  const event = firstRelation<{ title: string | null; date: string | null }>(registration.event)
  const order = firstRelation<{ user_id: string | null; currency: string | null }>(registration.order)

  const eligibility = getFlexibleRefundEligibility(
    {
      flexible_refund: registration.flexible_refund as boolean | null,
      paid_ticket_cents: registration.paid_ticket_cents as number | null,
      cancelled_at: registration.cancelled_at as string | null,
      checked_in: registration.checked_in as boolean | null,
      user_id: registration.user_id as string | null,
      guarantor_user_id: registration.guarantor_user_id as string | null,
      order_user_id: order?.user_id ?? null,
      event_date: event?.date ?? null,
    },
    userId,
    now,
  )
  if (!eligibility.eligible) throw new FlexibleRefundError(eligibility.reason)

  const paymentIntentId = registration.stripe_payment_intent_id as string | null
  if (!paymentIntentId || paymentIntentId.startsWith('free_')) throw new FlexibleRefundError('NOTHING_PAID')

  const currency = (order?.currency ?? 'eur').toLowerCase()
  const { data: refundRow, error: reserveError } = await admin
    .from('ticket_refunds')
    .insert({
      registration_id: registrationId,
      user_id: userId,
      stripe_payment_intent_id: paymentIntentId,
      amount_cents: eligibility.amountCents,
      currency,
      reason: 'flexible',
      status: 'pending',
    })
    .select('id')
    .single()
  if (reserveError) {
    if (reserveError.code === '23505') throw new FlexibleRefundError('IN_PROGRESS')
    throw reserveError
  }

  let stripeRefundId: string
  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        amount: eligibility.amountCents,
        reason: 'requested_by_customer',
        // Shown on the refund in the Stripe dashboard: who asked, from where, and under which rule.
        metadata: {
          type: 'flexible_refund',
          note: 'Remboursement demandé par le client depuis son espace Overbound, au titre de l’option billet flexible (CGV art. 10).',
          requested_by: 'client',
          user_id: userId,
          registration_id: registrationId,
          event: event?.title ?? '',
        },
      },
      { idempotencyKey: `flexible-refund-${refundRow.id}` },
    )
    stripeRefundId = refund.id
  } catch (stripeError) {
    console.error('[flexible refund] stripe refund failed', stripeError)
    await admin.from('ticket_refunds').update({ status: 'failed', updated_at: now.toISOString() }).eq('id', refundRow.id)
    throw new FlexibleRefundError('REFUND_FAILED')
  }

  await admin
    .from('ticket_refunds')
    .update({ status: 'succeeded', stripe_refund_id: stripeRefundId, updated_at: now.toISOString() })
    .eq('id', refundRow.id)

  const { error: cancelError } = await admin.rpc('cancel_registration_for_flexible_refund', {
    p_registration_id: registrationId,
  })
  if (cancelError) {
    console.error('[flexible refund] refunded but cancellation failed', { registrationId, stripeRefundId, cancelError })
    throw new FlexibleRefundError('CANCEL_FAILED')
  }

  return { amountCents: eligibility.amountCents, currency, eventTitle: event?.title ?? null, eventDate: event?.date ?? null }
}
