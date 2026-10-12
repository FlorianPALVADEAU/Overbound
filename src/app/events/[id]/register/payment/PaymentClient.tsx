'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle, ChevronLeft } from 'lucide-react'
import EmbeddedStripeCheckout from '@/components/EmbeddedStripeCheckout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { createRegistrations, registrationSuccessPath } from '@/lib/checkout/registrationApi'
import { buildRegistrationRequest } from '@/lib/checkout/registrationRequest'
import { checkPaymentReadiness } from '@/lib/checkout/paymentReadiness'
import { useRegistrationStore } from '@/store/useRegistrationStore'
import type { EventWithTickets } from '@/types/Event'
import type { Ticket } from '@/types/Ticket'
import type { Upsell } from '@/types/Upsell'
import PaymentBlocked from './PaymentBlocked'
import PaymentSummary from './PaymentSummary'

interface PaymentClientProps {
  event: EventWithTickets
  tickets: Ticket[]
  upsells: Upsell[]
  userEmail: string
}

type PaymentMessage = { type: 'success' | 'error'; text: string } | null

/** Takes the payment of a checkout draft, then registers the bibs from that same draft. */
export default function PaymentClient({ event, tickets, upsells, userEmail }: PaymentClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<PaymentMessage>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const draft = useRegistrationStore((state) => state.draft)
  const clearDraft = useRegistrationStore((state) => state.clear)
  const hasHydrated = useRegistrationStore((state) => state.hasHydrated)

  if (!hasHydrated) {
    return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Chargement de ton paiement sécurisé…</p>
  }

  const readiness = checkPaymentReadiness(draft, event.id)
  if (!readiness.ready) return <PaymentBlocked block={readiness.block} eventSlug={event.slug} />
  const paid = readiness.draft

  const handlePaymentSuccess = async (paymentIntent: { id: string }) => {
    setIsRegistering(true)
    setMessage(null)
    const outcome = await createRegistrations(buildRegistrationRequest(paid, { paymentIntentId: paymentIntent.id }))
    setIsRegistering(false)
    if (!outcome.ok) {
      setMessage({
        type: 'error',
        text: `${outcome.message} Ton paiement est bien reçu : contacte contact@overbound-race.com si ton billet n'apparaît pas dans ton espace.`,
      })
      return
    }
    // The account feed was cached before this purchase: drop it so the new bibs show up right away.
    await queryClient.invalidateQueries({ queryKey: ['account'] })
    setMessage({ type: 'success', text: 'Paiement confirmé ! On t’emmène vers ta confirmation.' })
    router.replace(registrationSuccessPath(event.slug, outcome.registrationId))
    clearDraft()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link href={`/events/${event.slug}/register`}>
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
            Modifier mes informations
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          Connecté en tant que <span className="font-medium text-foreground">{userEmail}</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(320px,1fr)] lg:items-start">
        <section aria-labelledby="payment-form-title" className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <h2 id="payment-form-title" className="text-lg font-semibold">
            Paiement sécurisé
          </h2>
          <EmbeddedStripeCheckout
            clientSecret={paid.clientSecret}
            onSuccess={handlePaymentSuccess}
            onError={(error: { message?: string } | undefined) =>
              setMessage({ type: 'error', text: error?.message || 'Le paiement a échoué ou a été interrompu. Réessaie.' })
            }
            totalAmount={paid.summary.totalDue}
            currency={paid.summary.currency}
            loading={isRegistering}
          />
          {message ? (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          ) : null}
        </section>

        <aside className="lg:sticky lg:top-24">
          <PaymentSummary draft={paid} tickets={tickets} tiers={event.price_tiers ?? []} upsells={upsells} />
        </aside>
      </div>
    </div>
  )
}
