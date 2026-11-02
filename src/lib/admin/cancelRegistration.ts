import type { SupabaseClient } from '@supabase/supabase-js'
import type { RefundCreator } from '@/lib/tickets/flexibleRefund'

type Admin = Pick<SupabaseClient, 'from' | 'rpc'>

export type AdminCancelErrorCode =
  | 'NOT_FOUND'
  | 'ALREADY_CANCELLED'
  | 'CHECKED_IN'
  | 'REASON_REQUIRED'
  | 'NOTHING_REFUNDABLE'
  | 'AMOUNT_TOO_HIGH'
  | 'IN_PROGRESS'
  | 'REFUND_FAILED'
  | 'CANCEL_FAILED'
  | 'CANCEL_AFTER_REFUND_FAILED'

const STATUS: Record<AdminCancelErrorCode, number> = {
  NOT_FOUND: 404,
  ALREADY_CANCELLED: 409,
  CHECKED_IN: 409,
  REASON_REQUIRED: 400,
  NOTHING_REFUNDABLE: 409,
  AMOUNT_TOO_HIGH: 400,
  IN_PROGRESS: 409,
  REFUND_FAILED: 502,
  CANCEL_FAILED: 500,
  CANCEL_AFTER_REFUND_FAILED: 500,
}

const MESSAGE: Record<AdminCancelErrorCode, string> = {
  NOT_FOUND: 'Inscription introuvable.',
  ALREADY_CANCELLED: 'Cette inscription est déjà annulée.',
  CHECKED_IN: 'Le participant est déjà enregistré au check-in : annule d’abord son check-in.',
  REASON_REQUIRED: 'Indique le motif de l’annulation.',
  NOTHING_REFUNDABLE: 'Aucun montant remboursable n’est enregistré pour ce billet : rembourse depuis Stripe si besoin.',
  AMOUNT_TOO_HIGH: 'Le montant dépasse le prix du billet payé.',
  IN_PROGRESS: 'Un remboursement est déjà en cours ou effectué pour cette inscription.',
  REFUND_FAILED: 'Stripe a refusé le remboursement. Rien n’a été annulé.',
  CANCEL_FAILED: 'L’annulation a échoué. Rien n’a été remboursé.',
  CANCEL_AFTER_REFUND_FAILED: 'Le remboursement est parti mais l’annulation a échoué : relance l’annulation sans remboursement.',
}

export class AdminCancelError extends Error {
  readonly status: number
  constructor(readonly code: AdminCancelErrorCode) {
    super(MESSAGE[code])
    this.status = STATUS[code]
  }
}

export type AdminRefundChoice =
  | { mode: 'none' }
  | { mode: 'ticket' }
  | { mode: 'custom'; amountCents: number }

export interface AdminCancelResult {
  refundedCents: number
  currency: string
}

/** Amount to refund, in cents, for a choice. Pure so the rule is testable without Stripe. */
export function resolveRefundCents(choice: AdminRefundChoice, refundableCents: number): number {
  if (choice.mode === 'none') return 0
  if (refundableCents <= 0) throw new AdminCancelError('NOTHING_REFUNDABLE')
  if (choice.mode === 'ticket') return refundableCents
  if (!Number.isInteger(choice.amountCents) || choice.amountCents <= 0) throw new AdminCancelError('AMOUNT_TOO_HIGH')
  if (choice.amountCents > refundableCents) throw new AdminCancelError('AMOUNT_TOO_HIGH')
  return choice.amountCents
}

const firstRelation = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

/**
 * Cancels a registration for an admin. Order matters: refund first (an exception leaves the bib untouched),
 * then cancel. If the cancellation fails after a refund, the error says so and the admin can cancel again
 * without a refund. The bib is never deleted: orders, signatures, upsells and ambassador points reference it.
 */
export async function cancelRegistrationAsAdmin(params: {
  admin: Admin
  stripe: RefundCreator
  adminUserId: string
  registrationId: string
  reason: string
  refund: AdminRefundChoice
  now?: Date
}): Promise<AdminCancelResult> {
  const { admin, stripe, adminUserId, registrationId, refund, now = new Date() } = params
  const reason = params.reason.trim()
  if (!reason) throw new AdminCancelError('REASON_REQUIRED')

  const { data: registration, error } = await admin
    .from('registrations')
    .select('id, checked_in, cancelled_at, paid_ticket_cents, stripe_payment_intent_id, event:events(title), order:orders(currency)')
    .eq('id', registrationId)
    .maybeSingle()
  if (error) throw error
  if (!registration) throw new AdminCancelError('NOT_FOUND')
  if (registration.cancelled_at) throw new AdminCancelError('ALREADY_CANCELLED')
  if (registration.checked_in) throw new AdminCancelError('CHECKED_IN')

  const { data: companions, error: companionsError } = await admin
    .from('registrations')
    .select('paid_ticket_cents, cancelled_at, checked_in')
    .eq('companion_of', registrationId)
  if (companionsError) throw companionsError
  const liveCompanions = (companions ?? []).filter((companion) => !companion.cancelled_at)
  if (liveCompanions.some((companion) => companion.checked_in)) throw new AdminCancelError('CHECKED_IN')

  const order = firstRelation<{ currency: string | null }>(registration.order)
  const event = firstRelation<{ title: string | null }>(registration.event)
  const currency = (order?.currency ?? 'eur').toLowerCase()
  const paymentIntentId = registration.stripe_payment_intent_id as string | null
  const payable = Boolean(paymentIntentId) && !paymentIntentId!.startsWith('free_')
  const refundableCents = payable
    ? ((registration.paid_ticket_cents as number | null) ?? 0) +
      liveCompanions.reduce((total, companion) => total + ((companion.paid_ticket_cents as number | null) ?? 0), 0)
    : 0

  const refundCents = resolveRefundCents(refund, refundableCents)

  if (refundCents > 0) {
    const { data: refundRow, error: reserveError } = await admin
      .from('ticket_refunds')
      .insert({
        registration_id: registrationId,
        user_id: null,
        admin_user_id: adminUserId,
        stripe_payment_intent_id: paymentIntentId,
        amount_cents: refundCents,
        currency,
        reason: 'admin',
        note: reason,
        status: 'pending',
      })
      .select('id')
      .single()
    if (reserveError) {
      if (reserveError.code === '23505') throw new AdminCancelError('IN_PROGRESS')
      throw reserveError
    }

    try {
      const stripeRefund = await stripe.refunds.create(
        {
          payment_intent: paymentIntentId!,
          amount: refundCents,
          reason: 'requested_by_customer',
          metadata: {
            type: 'admin_refund',
            note: reason.slice(0, 400),
            requested_by: 'admin',
            admin_user_id: adminUserId,
            registration_id: registrationId,
            event: event?.title ?? '',
          },
        },
        { idempotencyKey: `admin-refund-${refundRow.id}` },
      )
      await admin
        .from('ticket_refunds')
        .update({ status: 'succeeded', stripe_refund_id: stripeRefund.id, updated_at: now.toISOString() })
        .eq('id', refundRow.id)
    } catch (stripeError) {
      console.error('[admin cancel] stripe refund failed', stripeError)
      await admin.from('ticket_refunds').update({ status: 'failed', updated_at: now.toISOString() }).eq('id', refundRow.id)
      throw new AdminCancelError('REFUND_FAILED')
    }
  }

  const { error: cancelError } = await admin.rpc('admin_cancel_registration', {
    p_registration_id: registrationId,
    p_reason: reason,
  })
  if (cancelError) {
    console.error('[admin cancel] cancellation failed', { registrationId, refundCents, cancelError })
    throw new AdminCancelError(refundCents > 0 ? 'CANCEL_AFTER_REFUND_FAILED' : 'CANCEL_FAILED')
  }

  return { refundedCents: refundCents, currency }
}
