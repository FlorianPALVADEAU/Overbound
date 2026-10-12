import { buildUpsellRequest } from '@/lib/upsells/assignments'
import type { RegistrationDraft } from '@/store/useRegistrationStore'
import type { CreateRegistrationRequest } from './registrationRequestSchema'

export type SignedDraft = RegistrationDraft & { userId: string }

export const isSignedDraft = (draft: RegistrationDraft): draft is SignedDraft => typeof draft.userId === 'string'

interface PaymentReference {
  /** Stripe PaymentIntent id, or the `free_…` id of an order with nothing to pay. */
  paymentIntentId: string
  freeOrderMetadata?: Record<string, string>
}

/** Options of the draft as the APIs expect them: assignments by participant position, not id. */
export const draftUpsellRequest = (draft: RegistrationDraft) =>
  buildUpsellRequest(
    Object.fromEntries(draft.upsells.map((item) => [item.upsellId, { quantity: item.quantity, meta: item.meta }])),
    draft.participants.map((participant) => participant.id),
  )

/** The body of POST /api/registrations/create, built from the checkout draft and nothing else. */
export const buildRegistrationRequest = (draft: SignedDraft, payment: PaymentReference): CreateRegistrationRequest => ({
  paymentIntentId: payment.paymentIntentId,
  eventId: draft.eventId,
  userId: draft.userId,
  ticketSelections: draft.ticketSelections,
  participants: draft.participants.map((participant) => ({
    ticketId: participant.ticketId,
    firstName: participant.firstName,
    lastName: participant.lastName,
    email: participant.email,
    birthDate: participant.birthDate,
    emergencyContactName: participant.emergencyContactName,
    emergencyContactPhone: participant.emergencyContactPhone,
    medicalInfo: participant.medicalInfo,
    healthDataConsent: participant.healthDataConsent === true,
    licenseNumber: participant.licenseNumber,
    selectedWaveIndex: participant.selectedWaveIndex ?? null,
  })),
  upsells: draftUpsellRequest(draft),
  promoCodes: draft.promoCodes,
  ambassadorReferralCode: draft.ambassadorReferralCode,
  groupId: draft.groupId,
  signatureImage: draft.signature.imageDataUrl,
  signatureMetadata: {
    regulationVersion: draft.signature.regulationVersion,
    signedAt: draft.signature.signedAt,
  },
  disclaimer: draft.disclaimer,
  ...(payment.freeOrderMetadata ? { freeOrderMetadata: payment.freeOrderMetadata } : {}),
})
