import { useCallback, useState } from 'react'
import type { AppliedPromo } from '@/components/registration/types'

const MAX_PROMO_CODES = 2

export function usePromoCode(eventId: string) {
  const [appliedPromos, setAppliedPromos] = useState<AppliedPromo[]>([])
  const [promoInput, setPromoInput] = useState('')
  const [promoError, setPromoError] = useState<string | null>(null)

  const validatePromoCode = useCallback(async () => {
    const normalized = promoInput.trim().toUpperCase()
    if (!normalized) {
      setPromoError('Merci de saisir un code promo.')
      return
    }

    if (appliedPromos.length >= MAX_PROMO_CODES) {
      setPromoError('Vous pouvez appliquer au maximum 2 codes promo.')
      return
    }

    if (appliedPromos.some((promo) => promo.code.toUpperCase() === normalized)) {
      setPromoError('Ce code promo est déjà appliqué.')
      return
    }

    try {
      const response = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: normalized,
          eventId,
          existingCodes: appliedPromos.map((promo) => promo.code),
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Code promo invalide')
      }

      const data = (await response.json()) as { promotionalCode: AppliedPromo }
      setAppliedPromos((previous) => [...previous, data.promotionalCode])
      setPromoInput('')
      setPromoError(null)
    } catch (error) {
      setPromoError(error instanceof Error ? error.message : "Impossible d'appliquer ce code")
    }
  }, [appliedPromos, eventId, promoInput])

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
