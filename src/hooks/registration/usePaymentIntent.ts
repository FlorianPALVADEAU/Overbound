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

      const data = await response.json()

      // Free order: 100% discount, no Stripe payment needed
      if (data.freeOrder) {
        setPaymentIntentId(data.freeOrderId)
        setPricing(data.pricing)
        return {
          freeOrder: true as const,
          freeOrderId: data.freeOrderId as string,
          clientSecret: null,
          paymentIntentId: data.freeOrderId as string,
          pricing: data.pricing as PricingSummary,
          freeOrderMetadata: data.freeOrderMetadata as Record<string, string>,
          appliedPromo: data.appliedPromo,
          appliedPromos: data.appliedPromos,
        }
      }

      const typedData = data as {
        clientSecret: string
        paymentIntentId: string
        pricing: PricingSummary
      }

      if (typeof window !== 'undefined') {
        const eventId = `initiate_checkout_${typedData.paymentIntentId}`
        const analyticsWindow = window as Window & {
          dataLayer?: Array<Record<string, unknown>>
          fbq?: (...args: unknown[]) => void
        }
        analyticsWindow.dataLayer?.push({
          event: 'begin_checkout',
          event_id: eventId,
          event_slug: event.slug,
          event_key: event.id,
          value: Number((typedData.pricing.totalDue / 100).toFixed(2)),
          currency: typedData.pricing.currency.toUpperCase(),
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
            value: Number((typedData.pricing.totalDue / 100).toFixed(2)),
            currency: typedData.pricing.currency.toUpperCase(),
          },
          { eventID: eventId },
        )
      }

      setClientSecret(typedData.clientSecret)
      setPaymentIntentId(typedData.paymentIntentId)
      setPricing(typedData.pricing)
      return typedData
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
