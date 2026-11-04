import { z } from 'zod'

/** Body of POST /api/admin/emails/receipt. Stripe PaymentIntent ids always start with `pi_`. */
export const receiptResendSchema = z.object({
  paymentIntentId: z
    .string()
    .trim()
    .regex(/^pi_[A-Za-z0-9]+$/, 'Identifiant de paiement invalide'),
})

export type ReceiptResendInput = z.infer<typeof receiptResendSchema>
