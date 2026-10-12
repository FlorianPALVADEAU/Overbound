import { useCallback, useEffect, useState } from 'react'
import type { PricingSummary } from '@/components/registration/types'
import { trackBeginCheckout } from '@/lib/analytics/checkoutEvents'
import { readUtmParams } from '@/lib/attribution/utm'
import { buildPaymentIntentRequest } from '@/lib/checkout/paymentIntentRequest'
import type { SignedDraft } from '@/lib/checkout/registrationRequest'
import type { Event } from '@/types/Event'

export type PreparedPayment =
  | { kind: 'free'; paymentIntentId: string; pricing: PricingSummary; freeOrderMetadata: Record<string, string> }
  | { kind: 'stripe'; paymentIntentId: string; clientSecret: string; pricing: PricingSummary }

interface PaymentIntentState {
  clientSecret: string | null
  paymentIntentId: string | null
  pricing: PricingSummary | null
}

const NO_PAYMENT: PaymentIntentState = { clientSecret: null, paymentIntentId: null, pricing: null }

/**
 * The Stripe PaymentIntent of the checkout. Created on demand from the draft,
 * dropped as soon as anything that changes the amount changes.
 */
export function usePaymentIntent(event: Pick<Event, 'id' | 'slug' | 'title'>, amountKey: string) {
  const [payment, setPayment] = useState<PaymentIntentState>(NO_PAYMENT)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    setPayment(NO_PAYMENT)
  }, [amountKey])

  /** Asks the server to price and prepare the order. Throws with the visitor-facing reason on refusal. */
  const preparePayment = useCallback(
    async (draft: SignedDraft & { userEmail: string }): Promise<PreparedPayment> => {
      setIsCreating(true)
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPaymentIntentRequest(draft, readUtmParams())),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Impossible de préparer le paiement.')

        if (data.freeOrder) {
          setPayment({ clientSecret: null, paymentIntentId: data.freeOrderId, pricing: data.pricing })
          return { kind: 'free', paymentIntentId: data.freeOrderId, pricing: data.pricing, freeOrderMetadata: data.freeOrderMetadata ?? {} }
        }

        setPayment({ clientSecret: data.clientSecret, paymentIntentId: data.paymentIntentId, pricing: data.pricing })
        trackBeginCheckout(
          { eventId: event.id, eventSlug: event.slug, eventTitle: event.title },
          {
            paymentIntentId: data.paymentIntentId,
            ticketIds: draft.ticketSelections.map((item) => item.ticketId),
            totalCents: data.pricing.totalDue,
            currency: data.pricing.currency,
          },
        )
        return { kind: 'stripe', paymentIntentId: data.paymentIntentId, clientSecret: data.clientSecret, pricing: data.pricing }
      } finally {
        setIsCreating(false)
      }
    },
    [event.id, event.slug, event.title],
  )

  return { payment, isCreating, preparePayment }
}
