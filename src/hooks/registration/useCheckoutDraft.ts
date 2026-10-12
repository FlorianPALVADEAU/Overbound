import { useMemo } from 'react'
import { buildRegistrationDraft, type CheckoutDraftState } from '@/lib/checkout/registrationDraft'
import type { RegistrationDraft } from '@/store/useRegistrationStore'
import type { CheckoutConsents } from './useCheckoutConsents'

interface CheckoutDraftArgs extends Omit<CheckoutDraftState, 'signature' | 'disclaimer'> {
  consents: CheckoutConsents
  /** The buyer registers other people: their attestation travels with the draft. */
  needsGroupAttestation: boolean
}

/** The current checkout as one draft, rebuilt only when something in it changes. */
export function useCheckoutDraft({ consents, needsGroupAttestation, ...state }: CheckoutDraftArgs): RegistrationDraft {
  const { eventId, user, ticketSelections, participants, selectedUpsells, appliedPromos, ambassadorReferralCode, groupId, summary, clientSecret, paymentIntentId } = state
  return useMemo(
    () =>
      buildRegistrationDraft({
        eventId,
        user,
        ticketSelections,
        participants,
        selectedUpsells,
        appliedPromos,
        ambassadorReferralCode,
        groupId,
        summary,
        clientSecret,
        paymentIntentId,
        signature: { imageDataUrl: consents.signatureImage, signedAt: consents.signedAt },
        disclaimer: {
          read: consents.disclaimerRead,
          accepted: consents.disclaimerAccepted,
          rulebookAccepted: consents.rulebookAccepted,
          ...(needsGroupAttestation ? { groupAttestation: consents.groupAttestation } : {}),
        },
      }),
    [eventId, user, ticketSelections, participants, selectedUpsells, appliedPromos, ambassadorReferralCode, groupId, summary, clientSecret, paymentIntentId, consents, needsGroupAttestation],
  )
}
