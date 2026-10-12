import type { Participant } from '@/components/registration/types'
import { buildRegistrationDraft, type CheckoutDraftState } from './registrationDraft'

/** Builders for checkout tests: a complete, signed, one-bib OPEN order. */

export const participant = (overrides: Partial<Participant> = {}): Participant => ({
  id: 'participant-1',
  ticketId: 'open',
  firstName: 'Camille',
  lastName: 'Martin',
  email: 'camille@example.com',
  birthDate: '1990-05-04',
  emergencyContactName: 'Léo Martin',
  emergencyContactPhone: '0612345678',
  medicalInfo: '',
  healthDataConsent: false,
  flexible: false,
  licenseNumber: '',
  selectedWaveIndex: 3,
  ...overrides,
})

export const checkoutState = (overrides: Partial<CheckoutDraftState> = {}): CheckoutDraftState => ({
  eventId: 'event-1',
  user: { id: 'user-1', email: 'camille@example.com' },
  ticketSelections: { open: 1 },
  participants: [participant()],
  selectedUpsells: {},
  appliedPromos: [],
  ambassadorReferralCode: null,
  groupId: 'group-1',
  summary: { ticketTotal: 5000, upsellTotal: 0, discountAmount: 0, totalDue: 5000, currency: 'eur' },
  clientSecret: null,
  paymentIntentId: null,
  signature: { imageDataUrl: 'data:image/png;base64,abc', signedAt: '2026-06-01T12:00:00.000Z' },
  disclaimer: { read: true, accepted: true, rulebookAccepted: true },
  ...overrides,
})

export const signedDraft = (overrides: Partial<CheckoutDraftState> = {}) => {
  const draft = buildRegistrationDraft(checkoutState(overrides))
  if (!draft.userId) throw new Error('signed draft expected')
  return { ...draft, userId: draft.userId }
}
