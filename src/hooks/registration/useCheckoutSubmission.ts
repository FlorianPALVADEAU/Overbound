import { useEffect, useRef, useState, type RefObject } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import type { CardPaymentHandle } from '@/components/registration/PaymentSection'
import type { CheckoutValidation } from '@/lib/checkout/checkoutValidation'
import { createRegistrations, registrationSuccessPath } from '@/lib/checkout/registrationApi'
import { buildRegistrationRequest, isSignedDraft } from '@/lib/checkout/registrationRequest'
import { useRegistrationStore, type RegistrationDraft } from '@/store/useRegistrationStore'
import type { PreparedPayment } from './usePaymentIntent'

export type SubmissionMessage = { type: 'error' | 'success'; text: string } | null

interface CheckoutSubmissionArgs {
  eventSlug: string
  draft: RegistrationDraft
  validation: CheckoutValidation
  isSignedIn: boolean
  revealErrors: () => void
  requestSignIn: () => void
  /** The PaymentIntent already prepared for this exact amount, if any. */
  preparedPayment: PreparedPayment | null
  /** The card form of the page; null while the order has nothing to pay. */
  cardPayment: RefObject<CardPaymentHandle | null>
  preparePayment: (draft: Parameters<typeof buildRegistrationRequest>[0] & { userEmail: string }) => Promise<PreparedPayment>
}

/**
 * What happens on "Payer": check the form, sign in if needed, then either
 * check the card, create the PaymentIntent, charge, then register the bibs: one page, one click.
 */
export function useCheckoutSubmission(args: CheckoutSubmissionArgs) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const saveDraft = useRegistrationStore((state) => state.setDraft)
  const clearDraft = useRegistrationStore((state) => state.clear)
  const [message, setMessage] = useState<SubmissionMessage>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const payAfterSignInRef = useRef(false)
  /** Set once Stripe took the money, so a failed registration is retried without charging again. */
  const paidIntentIdRef = useRef<string | null>(null)

  const submit = async () => {
    const { draft, validation } = args
    if (!validation.sections.tickets || !validation.sections.participants) {
      args.revealErrors()
      setMessage({ type: 'error', text: 'Il manque des informations : on t’amène au premier champ à compléter.' })
      return
    }
    if (!args.isSignedIn || !isSignedDraft(draft) || !draft.userEmail) {
      payAfterSignInRef.current = true
      args.requestSignIn()
      return
    }
    if (!validation.isValid) {
      args.revealErrors()
      setMessage({ type: 'error', text: 'Lis et accepte la décharge et le règlement, puis signe.' })
      return
    }

    setMessage(null)
    setIsSubmitting(true)
    try {
      const signed = { ...draft, userEmail: draft.userEmail }
      const card = args.cardPayment.current

      if (!paidIntentIdRef.current) {
        const cardProblem = card ? await card.validate() : null
        if (cardProblem) return setMessage({ type: 'error', text: cardProblem })

        const payment = args.preparedPayment ?? (await args.preparePayment(signed))
        if (payment.kind === 'free') {
          const outcome = await createRegistrations(
            buildRegistrationRequest(signed, { paymentIntentId: payment.paymentIntentId, freeOrderMetadata: payment.freeOrderMetadata }),
          )
          if (!outcome.ok) return setMessage({ type: 'error', text: outcome.message })
          clearDraft()
          router.replace(registrationSuccessPath(args.eventSlug, outcome.registrationId))
          return
        }
        if (!card) return setMessage({ type: 'error', text: 'Le formulaire de paiement n’est pas disponible. Recharge la page.' })

        saveDraft({ ...signed, paymentIntentId: payment.paymentIntentId, clientSecret: payment.clientSecret, summary: payment.pricing })
        const charge = await card.confirm(payment.clientSecret)
        if (!charge.ok) return setMessage({ type: 'error', text: charge.message })
        paidIntentIdRef.current = charge.paymentIntentId
      }

      const outcome = await createRegistrations(buildRegistrationRequest(signed, { paymentIntentId: paidIntentIdRef.current }))
      if (!outcome.ok) {
        return setMessage({
          type: 'error',
          text: `${outcome.message} Ton paiement est bien reçu : réessaie, ou contacte contact@overbound-race.com si ton billet n'apparaît pas dans ton espace.`,
        })
      }
      // The account feed was cached before this purchase: drop it so the new bibs show up right away.
      await queryClient.invalidateQueries({ queryKey: ['account'] })
      clearDraft()
      router.replace(registrationSuccessPath(args.eventSlug, outcome.registrationId))
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Impossible de préparer le paiement.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // A guest who signs in to pay goes on to payment without clicking again.
  useEffect(() => {
    if (args.isSignedIn && payAfterSignInRef.current) {
      payAfterSignInRef.current = false
      void submit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resume once, when the visitor becomes signed in
  }, [args.isSignedIn])

  return { submit, message, isSubmitting }
}
