import { useCallback, useEffect, useState } from 'react'
import type { Event } from '@/types/Event'
import type {
  AppliedPromo,
  EventUser,
  Participant,
  PricingSummary,
  SelectedUpsellState,
  TicketSelections,
} from '@/components/registration/types'

export function usePaymentIntent(
  event: Event,
  user: EventUser | null,
  ticketSelections: TicketSelections,
  participants: Participant[],
  selectedUpsells: SelectedUpsellState,
  appliedPromos: AppliedPromo[],
  ambassadorReferralCode: string | null,
  totalDue: number,
) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [pricing, setPricing] = useState<PricingSummary | null>(null)
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false)
  const [submissionMessage, setSubmissionMessage] = useState<{
    type: 'error' | 'success'
    text: string
  } | null>(null)

  const resetPaymentIntent = useCallback(() => {
    setClientSecret(null)
    setPaymentIntentId(null)
    setPricing(null)
  }, [])

  // Reset when promo or upsells change
  useEffect(() => {
    resetPaymentIntent()
  }, [appliedPromos, selectedUpsells, resetPaymentIntent])

  const ensurePaymentIntent = useCallback(async () => {
    if (!user) {
      setSubmissionMessage({
        type: 'error',
        text: 'Connectez-vous pour continuer votre inscription.',
      })
      return null
    }

    if (totalDue <= 0) {
      setSubmissionMessage({
        type: 'error',
        text: 'Le montant total doit être supérieur à zéro.',
      })
      return null
    }

    setIsCreatingPaymentIntent(true)
    setSubmissionMessage(null)

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          userId: user.id,
          userEmail: user.email,
          ticketSelections: Object.entries(ticketSelections).map(([ticketId, quantity]) => ({
            ticketId,
            quantity,
          })),
          participants: participants.map((p) => ({
            ticketId: p.ticketId,
            email: p.email,
            firstName: p.firstName,
            lastName: p.lastName,
            distanceIdealKm: p.distanceIdealKm,
            distanceMinKm: p.distanceMinKm,
            difficultyLevel: p.difficultyLevel || null,
          })),
          upsells: Object.entries(selectedUpsells).map(([upsellId, config]) => ({
            upsellId,
            quantity: config.quantity,
            meta: config.meta || {},
          })),
          promoCodes: appliedPromos.map((promo) => promo.code),
          ambassadorReferralCode,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Impossible de préparer le paiement')
      }

      const data = (await response.json()) as {
        clientSecret: string
        paymentIntentId: string
        pricing: PricingSummary
      }

      if (typeof window !== 'undefined') {
        const eventId = `initiate_checkout_${data.paymentIntentId}`
        const analyticsWindow = window as Window & {
          dataLayer?: Array<Record<string, unknown>>
          fbq?: (...args: unknown[]) => void
        }
        analyticsWindow.dataLayer?.push({
          event: 'begin_checkout',
          event_id: eventId,
          event_slug: event.slug,
          event_key: event.id,
          value: Number((data.pricing.totalDue / 100).toFixed(2)),
          currency: data.pricing.currency.toUpperCase(),
        })
        analyticsWindow.fbq?.(
          'track',
          'InitiateCheckout',
          {
            content_name: event.title || event.slug,
            content_category: 'event',
            content_ids: Object.entries(ticketSelections)
              .filter(([, quantity]) => (quantity || 0) > 0)
              .map(([ticketId]) => ticketId),
            content_type: 'product',
            value: Number((data.pricing.totalDue / 100).toFixed(2)),
            currency: data.pricing.currency.toUpperCase(),
          },
          { eventID: eventId },
        )
      }

      setClientSecret(data.clientSecret)
      setPaymentIntentId(data.paymentIntentId)
      setPricing(data.pricing)
      return data
    } catch (error) {
      setSubmissionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erreur lors de la création du paiement',
      })
      throw error
    } finally {
      setIsCreatingPaymentIntent(false)
    }
  }, [
    appliedPromos,
    ambassadorReferralCode,
    event.id,
    event.slug,
    event.title,
    participants,
    selectedUpsells,
    ticketSelections,
    totalDue,
    user,
  ])

  return {
    clientSecret,
    setClientSecret,
    paymentIntentId,
    setPaymentIntentId,
    pricing,
    setPricing,
    isCreatingPaymentIntent,
    submissionMessage,
    setSubmissionMessage,
    resetPaymentIntent,
    ensurePaymentIntent,
  }
}
