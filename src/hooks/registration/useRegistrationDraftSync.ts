import { useEffect, useRef, type RefObject } from 'react'
import { useRegistrationStore, type RegistrationDraft } from '@/store/useRegistrationStore'
import type { AppliedPromo, Participant, SelectedUpsellState, TicketSelections } from '@/components/registration/types'

/** Where a restored draft is written back. Consents and signature are never restored (legal). */
export interface DraftRestoreTargets {
  setTicketSelections: (selections: TicketSelections) => void
  setParticipants: (participants: Participant[]) => void
  setSelectedUpsells: (upsells: SelectedUpsellState) => void
  setAppliedPromos: (promos: AppliedPromo[]) => void
}

/** Codes of a draft saved before full codes were kept: their discount is recomputed by the payment API. */
const restoredPromos = (draft: RegistrationDraft): AppliedPromo[] => {
  if (draft.appliedPromos && draft.appliedPromos.length > 0) return draft.appliedPromos
  const legacyCode = (draft as RegistrationDraft & { promoCode?: string | null }).promoCode
  const codes = draft.promoCodes.length > 0 ? draft.promoCodes : legacyCode ? [legacyCode] : []
  return codes.map((code) => ({
    id: code,
    code,
    description: '',
    discount_percent: null,
    discount_amount: null,
    currency: 'eur', // Legacy drafts only; the payment API recomputes everything.
    is_ambassador: draft.ambassadorReferralCode === code,
    target_upsell_id: null,
  }))
}

const restoredSelections = (draft: RegistrationDraft, initialTicketId: string | null, ticketIds: string[]) => {
  const selections: TicketSelections = Object.fromEntries(
    draft.ticketSelections.filter((item) => item.quantity > 0).map((item) => [item.ticketId, item.quantity]),
  )
  // A ticket chosen on the event page (?ticket=) wins over an older draft that does not include it.
  if (initialTicketId && ticketIds.includes(initialTicketId) && !(selections[initialTicketId] > 0)) {
    return { [initialTicketId]: 1 }
  }
  return selections
}

const freshSelections = (initialTicketId: string | null, ticketIds: string[]): TicketSelections => {
  if (initialTicketId && ticketIds.includes(initialTicketId)) return { [initialTicketId]: 1 }
  if (ticketIds.length === 1) return { [ticketIds[0] as string]: 1 }
  return {}
}

/**
 * Restores the saved checkout once on arrival, then saves the current one on
 * every change. The draft itself is built by `buildRegistrationDraft`.
 */
export function useRegistrationDraftSync(
  draft: RegistrationDraft,
  targets: DraftRestoreTargets,
  initialTicketId: string | null,
  ticketIds: string[],
  suppressEmptySyncRef: RefObject<boolean>,
) {
  const savedDraft = useRegistrationStore((state) => state.draft)
  const saveDraft = useRegistrationStore((state) => state.setDraft)
  const hasHydrated = useRegistrationStore((state) => state.hasHydrated)
  const restoredKeyRef = useRef<string | null>(null)
  const lastSavedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!hasHydrated) return
    const key = `${draft.eventId}-${initialTicketId ?? ''}`
    if (restoredKeyRef.current === key) return
    restoredKeyRef.current = key

    if (savedDraft && savedDraft.eventId === draft.eventId) {
      const selections = restoredSelections(savedDraft, initialTicketId, ticketIds)
      // Participants and selections land in separate renders: keep the restored participants meanwhile.
      if (Object.keys(selections).length > 0) suppressEmptySyncRef.current = true
      targets.setTicketSelections(selections)
      targets.setParticipants(savedDraft.participants.map((participant) => ({ ...participant })))
      targets.setSelectedUpsells(
        Object.fromEntries(savedDraft.upsells.map((item) => [item.upsellId, { quantity: item.quantity, meta: item.meta ?? {} }])),
      )
      // The PaymentIntent is not restored: a new one is prepared for the restored amount when paying.
      targets.setAppliedPromos(restoredPromos(savedDraft))
      return
    }

    targets.setTicketSelections(freshSelections(initialTicketId, ticketIds))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore runs once per event and preselected ticket
  }, [hasHydrated, draft.eventId, initialTicketId])

  // Once ticket selections reflect the restored draft, participants may follow them again.
  useEffect(() => {
    if (suppressEmptySyncRef.current && draft.ticketSelections.length > 0) suppressEmptySyncRef.current = false
  }, [draft.ticketSelections, suppressEmptySyncRef])

  useEffect(() => {
    if (!hasHydrated || restoredKeyRef.current === null) return
    const serialized = JSON.stringify(draft)
    if (lastSavedRef.current === serialized) return
    lastSavedRef.current = serialized
    saveDraft(draft)
  }, [hasHydrated, draft, saveDraft])

  return { hasHydrated }
}
