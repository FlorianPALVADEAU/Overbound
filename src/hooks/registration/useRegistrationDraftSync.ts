import { useEffect, useRef } from 'react'
import { REGULATION_VERSION } from '@/constants/registration'
import { useRegistrationStore } from '@/store/useRegistrationStore'
import type { RegistrationDraft, RegistrationSummary } from '@/store/useRegistrationStore'
import type {
  AppliedPromo,
  EventUser,
  Participant,
  PricingSummary,
  SelectedUpsellState,
  TicketSelections,
} from '@/components/registration/types'

interface DraftSyncConfig {
  eventId: string
  user: EventUser | null
  ticketSelections: TicketSelections
  participants: Participant[]
  selectedUpsells: SelectedUpsellState
  appliedPromos: AppliedPromo[]
  ambassadorReferralCode: string | null
  summaryPricing: PricingSummary
  clientSecret: string | null
  paymentIntentId: string | null
  signatureImage: string | null
  disclaimerRead: boolean
  disclaimerAccepted: boolean
}

interface DraftSyncSetters {
  setTicketSelections: (selections: TicketSelections) => void
  setParticipants: (participants: Participant[]) => void
  setSelectedUpsells: (upsells: SelectedUpsellState) => void
  setAppliedPromos: (promos: AppliedPromo[]) => void
  setPromoInput: (input: string) => void
  setPromoError: (error: string | null) => void
  setDisclaimerRead: (read: boolean) => void
  setDisclaimerAccepted: (accepted: boolean) => void
  setSignatureImage: (image: string | null) => void
  setClientSecret: (secret: string | null) => void
  setPaymentIntentId: (id: string | null) => void
  setPricing: (pricing: PricingSummary | null) => void
  setStepIndex: (index: number) => void
  setSubmissionMessage: (msg: null) => void
}

export function useRegistrationDraftSync(
  config: DraftSyncConfig,
  setters: DraftSyncSetters,
  initialTicketId: string | null,
  tickets: Array<{ id: string }>,
) {
  const registrationDraft = useRegistrationStore((state) => state.draft)
  const setRegistrationDraft = useRegistrationStore((state) => state.setDraft)
  const clearRegistrationDraft = useRegistrationStore((state) => state.clear)
  const registrationHasHydrated = useRegistrationStore((state) => state.hasHydrated)

  const initializationKeyRef = useRef<string | null>(null)
  const lastSavedDraftRef = useRef<string | null>(null)

  // Initialize from draft on mount
  useEffect(() => {
    if (!registrationHasHydrated) return

    const key = `${config.eventId}-${initialTicketId ?? ''}`

    if (initializationKeyRef.current !== key) {
      initializationKeyRef.current = key

      if (registrationDraft && registrationDraft.eventId === config.eventId) {
        const selectionRecord: TicketSelections = {}
        registrationDraft.ticketSelections.forEach((selection) => {
          if (selection.quantity > 0) {
            selectionRecord[selection.ticketId] = selection.quantity
          }
        })
        setters.setTicketSelections(selectionRecord)
        setters.setParticipants(registrationDraft.participants.map((p) => ({ ...p })))

        const upsellRecord: SelectedUpsellState = {}
        registrationDraft.upsells.forEach((item) => {
          upsellRecord[item.upsellId] = {
            quantity: item.quantity,
            meta: item.meta || {},
          }
        })
        setters.setSelectedUpsells(upsellRecord)

        const legacyPromoCode =
          (registrationDraft as RegistrationDraft & { promoCode?: string | null }).promoCode ?? null
        const restoredPromoCodes =
          registrationDraft.promoCodes && registrationDraft.promoCodes.length > 0
            ? registrationDraft.promoCodes
            : legacyPromoCode
              ? [legacyPromoCode]
              : []

        setters.setAppliedPromos(
          restoredPromoCodes.map((code) => ({
            id: code,
            code,
            description: '',
            discount_percent: null,
            discount_amount: null,
            currency: registrationDraft.summary.currency as any,
            is_ambassador: registrationDraft.ambassadorReferralCode === code,
          })),
        )
        setters.setPromoInput('')

        setters.setPromoError(null)
        // IMPORTANT: Ne jamais restaurer la décharge et la signature depuis le draft
        // L'utilisateur doit les confirmer à chaque session pour des raisons juridiques
        setters.setDisclaimerRead(false)
        setters.setDisclaimerAccepted(false)
        setters.setSignatureImage(null)
        setters.setClientSecret(registrationDraft.clientSecret)
        setters.setPaymentIntentId(registrationDraft.paymentIntentId)
        setters.setPricing(registrationDraft.summary)
        setters.setStepIndex(0)
        setters.setSubmissionMessage(null)
        return
      }

      setters.setStepIndex(0)
      setters.setSubmissionMessage(null)

      if (initialTicketId && tickets.some((t) => t.id === initialTicketId)) {
        setters.setTicketSelections({ [initialTicketId]: 1 })
      } else if (tickets.length === 1) {
        setters.setTicketSelections({ [tickets[0].id]: 1 })
      } else {
        setters.setTicketSelections({})
      }

      setters.setParticipants([])
      setters.setSelectedUpsells({})
      setters.setAppliedPromos([])
      setters.setPromoInput('')
      setters.setPromoError(null)
      setters.setDisclaimerRead(false)
      setters.setDisclaimerAccepted(false)
      setters.setSignatureImage(null)
      setters.setClientSecret(null)
      setters.setPaymentIntentId(null)
      setters.setPricing(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationHasHydrated, config.eventId, initialTicketId])

  // Auto-save to store on state changes
  useEffect(() => {
    if (!registrationHasHydrated) return

    if (!config.user) {
      clearRegistrationDraft()
      lastSavedDraftRef.current = null
      return
    }

    const ticketSelectionArray = Object.entries(config.ticketSelections).map(
      ([ticketId, quantity]) => ({ ticketId, quantity }),
    )

    const participantsPayload = config.participants.map((p) => ({ ...p }))

    const upsellsPayload = Object.entries(config.selectedUpsells).map(([upsellId, c]) => ({
      upsellId,
      quantity: c.quantity,
      meta: c.meta || {},
    }))

    const summaryPayload: RegistrationSummary = {
      ticketTotal: config.summaryPricing.ticketTotal,
      upsellTotal: config.summaryPricing.upsellTotal,
      discountAmount: config.summaryPricing.discountAmount,
      totalDue: config.summaryPricing.totalDue,
      currency: config.summaryPricing.currency,
    }

    const signaturePayload = {
      imageDataUrl: config.signatureImage,
      regulationVersion: REGULATION_VERSION,
      signedAt:
        config.signatureImage && registrationDraft?.signature.imageDataUrl === config.signatureImage
          ? registrationDraft?.signature.signedAt ?? new Date().toISOString()
          : config.signatureImage
            ? new Date().toISOString()
            : null,
    }

    const draftPayload: RegistrationDraft = {
      eventId: config.eventId,
      userId: config.user.id,
      userEmail: config.user.email || '',
      paymentIntentId: config.paymentIntentId ?? null,
      clientSecret: config.clientSecret ?? null,
      ticketSelections: ticketSelectionArray,
      participants: participantsPayload,
      upsells: upsellsPayload,
      promoCodes: config.appliedPromos.map((promo) => promo.code),
      ambassadorReferralCode: config.ambassadorReferralCode ?? null,
      summary: summaryPayload,
      signature: signaturePayload,
      disclaimer: {
        read: config.disclaimerRead,
        accepted: config.disclaimerAccepted,
      },
    }

    const serialized = JSON.stringify(draftPayload)
    if (lastSavedDraftRef.current === serialized) return

    lastSavedDraftRef.current = serialized
    setRegistrationDraft(draftPayload)
  }, [
    registrationHasHydrated,
    registrationDraft,
    config.user,
    config.eventId,
    config.ticketSelections,
    config.participants,
    config.selectedUpsells,
    config.appliedPromos,
    config.ambassadorReferralCode,
    config.summaryPricing.ticketTotal,
    config.summaryPricing.upsellTotal,
    config.summaryPricing.discountAmount,
    config.summaryPricing.totalDue,
    config.summaryPricing.currency,
    config.clientSecret,
    config.paymentIntentId,
    config.signatureImage,
    config.disclaimerRead,
    config.disclaimerAccepted,
    setRegistrationDraft,
    clearRegistrationDraft,
  ])

  return { registrationHasHydrated }
}
