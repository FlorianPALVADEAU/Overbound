import { z } from 'zod'
import { MAX_PROMO_CODES_PER_ORDER, normalizePromoCode } from '@/lib/orderPricing'
import { draftUpsellRequest, type SignedDraft } from './registrationRequest'

const codeSchema = z
  .unknown()
  .transform((value) => (typeof value === 'string' ? normalizePromoCode(value) : ''))

export const paymentIntentRequestSchema = z.object({
  eventId: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().min(1),
  ticketSelections: z
    .array(z.object({ ticketId: z.string().min(1), quantity: z.number().int().min(0) }))
    .min(1),
  participants: z
    .array(
      z.object({
        ticketId: z.string().min(1),
        flexible: z.boolean().optional(),
        birthDate: z.string().optional(),
        selectedWaveIndex: z.number().int().positive().nullable().optional(),
      }),
    )
    .min(1),
  upsells: z
    .array(
      z.object({
        upsellId: z.string().min(1),
        quantity: z.number().int().min(0),
        meta: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .default([]),
  promoCode: codeSchema.optional(),
  promoCodes: z.array(codeSchema).optional(),
  ambassadorReferralCode: codeSchema.optional(),
  groupId: z.string().nullable().optional(),
  utmParams: z.unknown().optional(),
})

/** Contract of POST /api/stripe/create-payment-intent, shared by the route and the checkout. */
export type PaymentIntentRequest = z.infer<typeof paymentIntentRequestSchema>
export type PaymentIntentRequestBody = z.input<typeof paymentIntentRequestSchema>

const HAS_SEPARATOR = /[,;|]/

/**
 * The codes of the order, deduplicated, ambassador code included. Combination
 * rules belong to the pricing engine; this only guards the request size and
 * keeps codes safe to store as CSV in Stripe metadata.
 */
export const readOrderCodes = (request: PaymentIntentRequest): { codes: string[] } | { error: string } => {
  const typed = request.promoCodes ?? (request.promoCode ? [request.promoCode] : [])
  const ambassador = request.ambassadorReferralCode ?? ''
  const codes = [...new Set([...typed, ambassador].filter((code) => code.length > 0))]

  if (codes.some((code) => HAS_SEPARATOR.test(code))) return { error: 'Format de code promo invalide.' }
  if (codes.length > MAX_PROMO_CODES_PER_ORDER) {
    return { error: `Tu peux appliquer ${MAX_PROMO_CODES_PER_ORDER} codes promo au maximum.` }
  }
  return { codes }
}

/** One pricing entry per bib, in participant order. */
export const readOrderParticipants = (request: PaymentIntentRequest) =>
  request.participants.map((participant) => ({ ticketId: participant.ticketId, flexible: participant.flexible === true }))

/** The body of POST /api/stripe/create-payment-intent, built from the same draft as the registration request. */
export const buildPaymentIntentRequest = (
  draft: SignedDraft & { userEmail: string },
  utmParams: unknown,
): PaymentIntentRequestBody => ({
  eventId: draft.eventId,
  userId: draft.userId,
  userEmail: draft.userEmail,
  ticketSelections: draft.ticketSelections,
  participants: draft.participants.map((participant) => ({
    ticketId: participant.ticketId,
    flexible: participant.flexible === true,
    birthDate: participant.birthDate,
    selectedWaveIndex: participant.selectedWaveIndex ?? null,
  })),
  upsells: draftUpsellRequest(draft),
  promoCodes: draft.promoCodes,
  ambassadorReferralCode: draft.ambassadorReferralCode,
  groupId: draft.groupId,
  utmParams,
})
