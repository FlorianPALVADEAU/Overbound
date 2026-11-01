import { useCallback, useEffect, useRef, useState } from 'react'
import { clearReferralCode, readReferralCode } from '@/lib/attribution/referral'
import type { AppliedPromo } from '@/components/registration/types'
import { MAX_PROMO_CODES_PER_ORDER } from '@/lib/orderPricing'

export function usePromoCode(eventId: string) {
  const [appliedPromos, setAppliedPromos] = useState<AppliedPromo[]>([])
  const [promoInput, setPromoInput] = useState('')
  const [promoError, setPromoError] = useState<string | null>(null)

  const requestPromo = useCallback(
    async (code: string, existingCodes: string[]): Promise<AppliedPromo> => {
      const response = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, eventId, existingCodes }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Code promo invalide')
      }

      return ((await response.json()) as { promotionalCode: AppliedPromo }).promotionalCode
    },
    [eventId],
  )

  // A friend who arrived through an ambassador link (?ref=CODE) gets the code applied once. A code
  // that is invalid or not an ambassador code is dropped silently: the field stays empty and usable.
  const referralTried = useRef(false)
  useEffect(() => {
    if (referralTried.current) return
    referralTried.current = true
    const referral = readReferralCode()
    if (!referral) return
    clearReferralCode()
    requestPromo(referral, [])
      .then((promo) => {
        if (promo.is_ambassador) setAppliedPromos((previous) => (previous.length === 0 ? [promo] : previous))
      })
      .catch(() => undefined)
  }, [requestPromo])

  const validatePromoCode = useCallback(async () => {
    const normalized = promoInput.trim().toUpperCase()
    if (!normalized) {
      setPromoError('Merci de saisir un code promo.')
      return
    }

    if (appliedPromos.length >= MAX_PROMO_CODES_PER_ORDER) {
      setPromoError('Deux codes promo maximum par commande.')
      return
    }

    if (appliedPromos.some((promo) => promo.code.toUpperCase() === normalized)) {
      setPromoError('Ce code promo est déjà appliqué.')
      return
    }

    try {
      const promo = await requestPromo(normalized, appliedPromos.map((applied) => applied.code))
      setAppliedPromos((previous) => [...previous, promo])
      setPromoInput('')
      setPromoError(null)
    } catch (error) {
      setPromoError(error instanceof Error ? error.message : "Impossible d'appliquer ce code")
    }
  }, [appliedPromos, promoInput, requestPromo])

  const removePromo = useCallback((code: string) => {
    setAppliedPromos((previous) => previous.filter((promo) => promo.code !== code))
    setPromoError(null)
  }, [])

  return {
    appliedPromos,
    setAppliedPromos,
    promoInput,
    setPromoInput,
    promoError,
    setPromoError,
    ambassadorReferralCode: appliedPromos.find((promo) => promo.is_ambassador)?.code ?? null,
    validatePromoCode,
    removePromo,
  }
}
