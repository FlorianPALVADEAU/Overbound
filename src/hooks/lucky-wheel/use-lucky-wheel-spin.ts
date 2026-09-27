'use client'

import { useCallback, useState } from 'react'

export interface LuckyWheelCampaignInfo {
  id: string
  name: string
  triggerRules: Record<string, unknown>
}

export interface LuckyWheelSpinOutcome {
  success: boolean
  allocationId?: string
  rewardId?: string
  rewardName?: string
  rewardType?: string
  // The real, manually-enterable promo code for discount-type rewards --
  // null for reward types with no checkout-side effect. Shown on the
  // result screen and emailed; typed manually at checkout like any other
  // promo code (2026-09-21: replaces the earlier device-bound auto-apply
  // design, see src/lib/luckyWheel/redemption.ts header).
  promoCode?: string | null
  expiresAt?: string
  error?: string
}

const ALREADY_PARTICIPATED_KEY = (eventId: string) => `overbound-lucky-wheel-participated-${eventId}`

// FDR-0014 §3.2/§3.3: email capture creates the entry, spin always resolves
// server-side. localStorage flag is a UX convenience only (skip refetching
// the widget shell) -- the real "already participated" guarantee is the
// (campaign_id, email) unique constraint enforced server-side (§6).
export function useLuckyWheelSpin(eventId: string) {
  const [wheelEntryId, setWheelEntryId] = useState<string | null>(null)
  // Set right after email submission, before the participant clicks "spin"
  // -- lets the widget show the wheel/suspense step without spinning
  // immediately (spec §3.3: result must exist before/during the animation,
  // but the animation itself is user-paced, not automatic).
  const [pendingEntryId, setPendingEntryId] = useState<string | null>(null)
  const [submittingEmail, setSubmittingEmail] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [outcome, setOutcome] = useState<LuckyWheelSpinOutcome | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasLocalParticipationFlag = useCallback(() => {
    try {
      return localStorage.getItem(ALREADY_PARTICIPATED_KEY(eventId)) === 'true'
    } catch {
      return false
    }
  }, [eventId])

  const submitEmail = useCallback(
    async ({ email, marketingConsent }: { email: string; marketingConsent: boolean }) => {
      setSubmittingEmail(true)
      setError(null)
      try {
        const response = await fetch('/api/lucky-wheel/entry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_id: eventId, email, marketing_consent: marketingConsent }),
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de la participation')
        }
        setWheelEntryId(data.wheel_entry_id)
        if (data.already_participated) {
          try {
            localStorage.setItem(ALREADY_PARTICIPATED_KEY(eventId), 'true')
          } catch {
            // localStorage unavailable (private mode) -- non-blocking, the
            // server remains the source of truth for participation state.
          }
        }
        return { wheelEntryId: data.wheel_entry_id as string, alreadyParticipated: Boolean(data.already_participated) }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la participation'
        setError(message)
        throw err
      } finally {
        setSubmittingEmail(false)
      }
    },
    [eventId],
  )

  // Result is always server-determined (spec §3.3) -- this call resolves
  // the outcome; the caller animates toward it, never before it.
  const spin = useCallback(async (entryId: string) => {
    setSpinning(true)
    setError(null)
    try {
      const response = await fetch('/api/lucky-wheel/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wheel_entry_id: entryId }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du tirage')
      }

      try {
        localStorage.setItem(ALREADY_PARTICIPATED_KEY(eventId), 'true')
      } catch {
        // Non-blocking.
      }

      if (data.success === false) {
        const result: LuckyWheelSpinOutcome = { success: false, error: data.error }
        setOutcome(result)
        return result
      }

      const result: LuckyWheelSpinOutcome = {
        success: true,
        allocationId: data.allocation_id,
        rewardId: data.reward_id,
        rewardName: data.reward_name,
        rewardType: data.reward_type,
        promoCode: data.promo_code ?? null,
        expiresAt: data.expires_at,
      }
      setOutcome(result)

      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du tirage'
      setError(message)
      throw err
    } finally {
      setSpinning(false)
    }
  }, [eventId])

  return {
    wheelEntryId,
    pendingEntryId,
    setPendingEntryId,
    submittingEmail,
    spinning,
    outcome,
    error,
    hasLocalParticipationFlag,
    submitEmail,
    spin,
  }
}
