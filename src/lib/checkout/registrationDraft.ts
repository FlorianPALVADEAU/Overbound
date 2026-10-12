import type { AppliedPromo, Participant } from '@/components/registration/types'
import { REGULATION_VERSION } from '@/constants/registration'
import type { PricingSummary } from '@/lib/orderPricing'
import type { RegistrationDisclaimer, RegistrationDraft } from '@/store/useRegistrationStore'

export interface CheckoutDraftState {
  eventId: string
  user: { id: string; email: string } | null
  ticketSelections: Record<string, number>
  participants: Participant[]
  selectedUpsells: Record<string, { quantity: number; meta?: Record<string, unknown> }>
  appliedPromos: AppliedPromo[]
  ambassadorReferralCode: string | null
  groupId: string | null
  summary: PricingSummary
  clientSecret: string | null
  paymentIntentId: string | null
  signature: { imageDataUrl: string | null; signedAt: string | null }
  disclaimer: RegistrationDisclaimer
}

/**
 * The single snapshot of a checkout. Saved while the visitor types, handed to
 * the payment page, and the only source of the registration request: every
 * path to /api/registrations/create goes through it.
 */
export const buildRegistrationDraft = (state: CheckoutDraftState): RegistrationDraft => ({
  eventId: state.eventId,
  userId: state.user?.id ?? null,
  userEmail: state.user?.email || null,
  paymentIntentId: state.paymentIntentId,
  clientSecret: state.clientSecret,
  ticketSelections: Object.entries(state.ticketSelections)
    .filter(([, quantity]) => quantity > 0)
    .map(([ticketId, quantity]) => ({ ticketId, quantity })),
  participants: state.participants.map((participant) => ({ ...participant })),
  upsells: Object.entries(state.selectedUpsells).map(([upsellId, selection]) => ({
    upsellId,
    quantity: selection.quantity,
    meta: selection.meta ?? {},
  })),
  promoCodes: state.appliedPromos.map((promo) => promo.code),
  appliedPromos: state.appliedPromos,
  ambassadorReferralCode: state.ambassadorReferralCode,
  groupId: state.groupId,
  summary: state.summary,
  signature: { ...state.signature, regulationVersion: REGULATION_VERSION },
  disclaimer: state.disclaimer,
})
