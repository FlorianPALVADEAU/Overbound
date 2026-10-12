import type { RegistrationDraft } from '@/store/useRegistrationStore'
import { isSignedDraft, type SignedDraft } from './registrationRequest'

export type PaymentBlock = 'NO_DRAFT' | 'NO_PAYMENT_INTENT' | 'NOT_SIGNED'

export type PaymentReadiness =
  | { ready: true; draft: SignedDraft & { clientSecret: string; paymentIntentId: string } }
  | { ready: false; block: PaymentBlock }

/** Whether the payment page can take money for this draft, and why not. */
export const checkPaymentReadiness = (draft: RegistrationDraft | null, eventId: string): PaymentReadiness => {
  if (!draft || draft.eventId !== eventId || !isSignedDraft(draft)) return { ready: false, block: 'NO_DRAFT' }
  if (!draft.clientSecret || !draft.paymentIntentId) return { ready: false, block: 'NO_PAYMENT_INTENT' }
  const signed = Boolean(draft.signature.imageDataUrl?.trim())
  const accepted = draft.disclaimer.read && draft.disclaimer.accepted && draft.disclaimer.rulebookAccepted
  if (!signed || !accepted) return { ready: false, block: 'NOT_SIGNED' }
  return { ready: true, draft: { ...draft, clientSecret: draft.clientSecret, paymentIntentId: draft.paymentIntentId } }
}
