'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { REGISTRATION_STORAGE_KEY } from '@/constants/registration'

export type RegistrationTicketSelection = {
  ticketId: string
  quantity: number
}

export type RegistrationParticipant = {
  id: string
  ticketId: string
  firstName: string
  lastName: string
  email: string
  birthDate: string
  emergencyContactName: string
  emergencyContactPhone: string
  medicalInfo: string
  licenseNumber: string
}

export type RegistrationUpsellSelection = {
  upsellId: string
  quantity: number
  meta?: Record<string, any>
}

export type RegistrationSummary = {
  ticketTotal: number
  upsellTotal: number
  discountAmount: number
  totalDue: number
  currency: string
}

export type RegistrationSignature = {
  imageDataUrl: string | null
  regulationVersion: string
  signedAt: string | null
}

export type RegistrationDisclaimer = {
  read: boolean
  accepted: boolean
}

export type RegistrationDraft = {
  eventId: string
  userId: string
  userEmail: string
  paymentIntentId: string | null
  clientSecret: string | null
  ticketSelections: RegistrationTicketSelection[]
  participants: RegistrationParticipant[]
  upsells: RegistrationUpsellSelection[]
  promoCode: string | null
  summary: RegistrationSummary
  signature: RegistrationSignature
  disclaimer: RegistrationDisclaimer
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
