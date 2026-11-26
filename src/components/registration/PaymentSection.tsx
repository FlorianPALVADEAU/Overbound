'use client'

import { forwardRef, useImperativeHandle } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { STRIPE_APPEARANCE } from '@/lib/stripe/appearance'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export type CardPaymentResult = { ok: true; paymentIntentId: string } | { ok: false; message: string }

/** What the checkout asks of the card form: check what was typed, then charge once the order is priced. */
export interface CardPaymentHandle {
  /** Visitor-facing problem with the typed card details, or null when they are complete. */
  validate: () => Promise<string | null>
  confirm: (clientSecret: string) => Promise<CardPaymentResult>
}

const PAYMENT_METHODS = ['card', 'link']

const CardForm = forwardRef<CardPaymentHandle>(function CardForm(_props, ref) {
  const stripe = useStripe()
  const elements = useElements()

  useImperativeHandle(
    ref,
    () => ({
      validate: async () => {
        if (!stripe || !elements) return 'Le paiement se charge encore, réessaie dans un instant.'
        const { error } = await elements.submit()
        return error ? (error.message ?? 'Vérifie les informations de ta carte.') : null
      },
      confirm: async (clientSecret) => {
        if (!stripe || !elements) return { ok: false, message: 'Le paiement se charge encore, réessaie dans un instant.' }
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: { return_url: window.location.href },
          redirect: 'if_required',
        })
        if (error) return { ok: false, message: error.message ?? 'Le paiement a échoué ou a été interrompu. Réessaie.' }
        if (paymentIntent?.status === 'succeeded') return { ok: true, paymentIntentId: paymentIntent.id }
        return { ok: false, message: 'Le paiement n’est pas confirmé. Réessaie.' }
      },
    }),
    [stripe, elements],
  )

  return <PaymentElement options={{ layout: 'tabs' }} />
})

interface PaymentSectionProps {
  /** Amount due now, in cents. The card form only exists above Stripe's minimum. */
  amountCents: number
  currency: string
}

/**
 * The card form, on the checkout page itself. The PaymentIntent is created on "Payer", from the
 * exact order: until then Stripe only needs the amount and the currency (deferred intent).
 */
const PaymentSection = forwardRef<CardPaymentHandle, PaymentSectionProps>(function PaymentSection({ amountCents, currency }, ref) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: 'payment',
        amount: amountCents,
        currency: currency.toLowerCase(),
        paymentMethodTypes: PAYMENT_METHODS,
        appearance: STRIPE_APPEARANCE,
      }}
    >
      <CardForm ref={ref} />
    </Elements>
  )
})

export default PaymentSection
