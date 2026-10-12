'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { REGISTRATION_STORAGE_KEY } from '@/constants/registration'
import type { AppliedPromo, Participant } from '@/components/registration/types'
import type { PricingSummary } from '@/lib/orderPricing'

export type RegistrationTicketSelection = {
  ticketId: string
  quantity: number
}

/** A bib of the order, exactly as typed in the checkout, chosen SAS included. */
export type RegistrationParticipant = Participant

export type RegistrationUpsellSelection = {
  upsellId: string
  quantity: number
  meta?: Record<string, any>
}

export type RegistrationSummary = PricingSummary

export type RegistrationSignature = {
  imageDataUrl: string | null
  regulationVersion: string
  signedAt: string | null
}

export type RegistrationDisclaimer = {
  read: boolean
  accepted: boolean
  rulebookAccepted: boolean
  /** Set only when the buyer registers other people and vouches for them. */
  groupAttestation?: boolean
}

export type RegistrationDraft = {
  eventId: string
  userId: string | null
  userEmail: string | null
  paymentIntentId: string | null
  clientSecret: string | null
  ticketSelections: RegistrationTicketSelection[]
  participants: RegistrationParticipant[]
  upsells: RegistrationUpsellSelection[]
  promoCodes: string[]
  /** Codes as validated, to restore their discount after a reload. Absent in older drafts. */
  appliedPromos?: AppliedPromo[]
  ambassadorReferralCode: string | null
  groupId: string | null
  summary: RegistrationSummary
  signature: RegistrationSignature
  disclaimer: RegistrationDisclaimer
  stepIndex?: number
}

interface RegistrationStore {
  draft: RegistrationDraft | null
  hasHydrated: boolean
  setDraft: (draft: RegistrationDraft) => void
  clear: () => void
  setHasHydrated: (hasHydrated: boolean) => void
}

export const useRegistrationStore = create<RegistrationStore>()(
  persist(
    (set) => ({
      draft: null,
      hasHydrated: false,
      setDraft: (draft) => set({ draft }),
      clear: () => set({ draft: null }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: REGISTRATION_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      partialize: (state) => ({ draft: state.draft }),
    }
  )
)
