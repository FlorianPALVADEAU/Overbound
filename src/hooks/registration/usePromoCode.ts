import { useCallback, useState } from 'react'
import type { AppliedPromo } from '@/components/registration/types'

export function usePromoCode(eventId: string) {
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null)
  const [promoInput, setPromoInput] = useState('')
  const [promoError, setPromoError] = useState<string | null>(null)

  const validatePromoCode = useCallback(async () => {
    const normalized = promoInput.trim().toUpperCase()
    if (!normalized) {
      setPromoError('Merci de saisir un code promo.')
      return
    }

    try {
      const response = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized, eventId }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Code promo invalide')
      }

      const data = (await response.json()) as { promotionalCode: AppliedPromo }
      setAppliedPromo(data.promotionalCode)
      setPromoError(null)
    } catch (error) {
      setAppliedPromo(null)
      setPromoError(error instanceof Error ? error.message : "Impossible d'appliquer ce code")
    }
  }, [eventId, promoInput])

  const removePromo = useCallback(() => {
    setAppliedPromo(null)
    setPromoInput('')
    setPromoError(null)
  }, [])

  return {
    appliedPromo,
    setAppliedPromo,
    promoInput,
    setPromoInput,
    promoError,
    setPromoError,
    validatePromoCode,
    removePromo,
  }
}
