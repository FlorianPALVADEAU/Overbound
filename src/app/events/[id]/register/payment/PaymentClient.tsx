'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import EmbeddedStripeCheckout from '@/components/EmbeddedStripeCheckout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, AlertTriangle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { Event } from '@/types/Event'
import type { Ticket } from '@/types/Ticket'
import type { Upsell } from '@/types/Upsell'
import { useRegistrationStore } from '@/store/useRegistrationStore'

interface EventTicket extends Ticket {}

interface PaymentClientProps {
  event: Event
  tickets: EventTicket[]
  upsells: Upsell[]
  userEmail: string
}

export default function PaymentClient({ event, tickets, upsells, userEmail }: PaymentClientProps) {
  const router = useRouter()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const registrationDraft = useRegistrationStore((state) => state.draft)
  const clearRegistrationDraft = useRegistrationStore((state) => state.clear)
  const registrationHasHydrated = useRegistrationStore((state) => state.hasHydrated)

  const ticketMap = useMemo(() => {
    return Object.fromEntries(tickets.map((ticket) => [ticket.id, ticket]))
  }, [tickets])

  const upsellMap = useMemo(() => {
    return Object.fromEntries(upsells.map((upsell) => [upsell.id, upsell]))
  }, [upsells])

  const handlePaymentSuccess = async (paymentIntent: any) => {
    if (!registrationDraft) return
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/registrations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          eventId: registrationDraft.eventId,
          userId: registrationDraft.userId,
          ticketSelections: registrationDraft.ticketSelections,
          participants: registrationDraft.participants.map(({ id: _id, ...participant }) => participant),
          upsells: registrationDraft.upsells,
          promoCode: registrationDraft.promoCode,
          signatureImage: registrationDraft.signature.imageDataUrl,
          signatureMetadata: {
            regulationVersion: registrationDraft.signature.regulationVersion,
            signedAt: registrationDraft.signature.signedAt,
          },
          disclaimer: registrationDraft.disclaimer,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || 'Erreur lors de la finalisation de l\'inscription')
      }

      setMessage({
        type: 'success',
        text: '🎉 Paiement confirmé ! Redirection en cours vers la page de confirmation.',
      })

      setTimeout(() => {
        clearRegistrationDraft()
        router.replace(`/events/${event.id}/success?payment_intent=${paymentIntent.id}`)
      }, 1200)
    } catch (err) {
      console.error('Erreur finalisation inscription:', err)
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Impossible de finaliser votre inscription. Contactez le support.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentError = (stripeError: any) => {
    setMessage({
      type: 'error',
      text: stripeError?.message || 'Le paiement a échoué ou a été interrompu. Merci de réessayer.',
    })
  }

  if (!registrationHasHydrated) {
    return (
      <div className="rounded-lg border border-dashed border-muted p-8 text-center text-sm text-muted-foreground">
        Chargement de votre paiement sécurisé...
      </div>
    )
  }

  if (!registrationDraft || registrationDraft.eventId !== event.id) {
    return (
      <div className="space-y-4">
        {message ? (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            {message.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Aucune inscription en cours. Merci de revenir depuis la page d'inscription.
            </AlertDescription>
          </Alert>
        )}
        <Button asChild variant="outline">
          <Link href={`/events/${event.id}/register`}>Revenir à l'inscription</Link>
        </Button>
      </div>
    )
  }

  if (!registrationDraft.clientSecret || !registrationDraft.paymentIntentId) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Les informations de paiement sont manquantes ou expirées. Merci de revenir à l'étape précédente pour les régénérer.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href={`/events/${event.id}/register`}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Retour à l'inscription
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${event.id}/register`}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Modifier mes informations
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          Vous êtes connecté en tant que <span className="font-medium">{userEmail}</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paiement sécurisé</CardTitle>
            <CardDescription>Entrez vos informations de paiement pour finaliser votre inscription.</CardDescription>
          </CardHeader>
          <CardContent>
           <EmbeddedStripeCheckout
              clientSecret={registrationDraft.clientSecret}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              totalAmount={registrationDraft.summary.totalDue}
              currency={registrationDraft.summary.currency}
              loading={isSubmitting}
            />
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Résumé de la commande</CardTitle>
              <CardDescription>
                Vérifiez vos informations avant de confirmer le paiement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <div className="text-xs uppercase text-muted-foreground">Billets & participants</div>
                {registrationDraft.participants.length === 0 ? (
                  <p className="text-muted-foreground">Aucun participant renseigné.</p>
                ) : (
                  registrationDraft.participants.map((participant, index) => {
                    const ticket = ticketMap[participant.ticketId]
                    return (
                      <div key={`${participant.email}-${index}`} className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="font-medium">{`${participant.firstName} ${participant.lastName}`.trim() || 'Participant'}</p>
                          <p className="text-xs text-muted-foreground">{participant.email}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {ticket?.name || 'Billet'}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-xs uppercase text-muted-foreground">Options</div>
                {registrationDraft.upsells.length === 0 ? (
                  <p className="text-muted-foreground">Aucune option ajoutée.</p>
                ) : (
                  registrationDraft.upsells.map((item) => {
                    const upsell = upsellMap[item.upsellId]
                    if (!upsell) return null
                    return (
                      <div key={item.upsellId} className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="font-medium">{item.quantity} × {upsell.name}</p>
                          {item.meta?.size ? (
                            <p className="text-xs text-muted-foreground">Taille {item.meta.size}</p>
                          ) : null}
                        </div>
                        <span className="font-medium">
                          {(upsell.price_cents * item.quantity / 100).toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: (upsell.currency || 'eur').toUpperCase(),
                          })}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Sous-total billets</span>
                  <span>{(registrationDraft.summary.ticketTotal / 100).toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: registrationDraft.summary.currency.toUpperCase(),
                  })}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Options</span>
                  <span>{(registrationDraft.summary.upsellTotal / 100).toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: registrationDraft.summary.currency.toUpperCase(),
                  })}</span>
                </div>
                {registrationDraft.summary.discountAmount > 0 ? (
                  <div className="flex items-center justify-between text-sm text-emerald-600">
                    <span>Réduction</span>
                    <span>- {(registrationDraft.summary.discountAmount / 100).toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: registrationDraft.summary.currency.toUpperCase(),
                    })}</span>
                  </div>
                ) : null}
                <Separator />
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Total à régler</span>
                  <span>{(registrationDraft.summary.totalDue / 100).toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: registrationDraft.summary.currency.toUpperCase(),
                  })}</span>
                </div>
                {registrationDraft.promoCode ? (
                  <p className="text-xs text-muted-foreground">
                    Code promotionnel appliqué : <span className="font-medium">{registrationDraft.promoCode}</span>
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {message ? (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'error' ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
