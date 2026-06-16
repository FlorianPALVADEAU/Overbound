'use client'
import { useEffect, useRef } from 'react'
import { useSearchParams, useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Download,
  Trophy,
  QrCode,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSession } from '@/app/api/session/sessionQueries'
import { useEventSuccess } from '@/app/api/events/[id]/success/successQueries'
import { formatClockTimeParis } from '@/lib/dateTime'

const formatPrice = (priceInCents: number, currency: string) =>
  (priceInCents / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  })

const getDifficultyColor = (difficulty: number) => {
  if (difficulty <= 3) return 'bg-green-100 text-green-800'
  if (difficulty <= 6) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

export default function EventSuccessPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams?.get('session_id') ?? ''
  const paymentIntentId = searchParams?.get('payment_intent') ?? ''
  const registrationId = searchParams?.get('registration_id') ?? ''
  const hasReference = Boolean(sessionId || paymentIntentId || registrationId)
  const { data: session, isLoading: sessionLoading } = useSession()
  const purchaseTrackedRef = useRef(false)
  const { data, isLoading, error, refetch } = useEventSuccess(params.id, {
    sessionId,
    paymentIntentId,
    registrationId,
  }, {
    enabled: Boolean(session?.user) && hasReference,
  })

  useEffect(() => {
    const registration = data?.registration
    if (!registration || purchaseTrackedRef.current) return
    purchaseTrackedRef.current = true

    const analyticsWindow = window as Window & {
      dataLayer?: Array<Record<string, unknown>>
      gtag?: (...args: unknown[]) => void
      fbq?: (...args: unknown[]) => void
    }

    const value = Number((registration.order.amount_total / 100).toFixed(2))
    const currency = registration.order.currency.toUpperCase()
    const transactionId = registration.order.id
    const eventId = `purchase_${transactionId}`

    analyticsWindow.dataLayer?.push({
      event: 'purchase',
      transaction_id: transactionId,
      value,
      currency,
      event_slug: registration.event.slug,
      event_id: registration.event.id,
    })

    analyticsWindow.gtag?.('event', 'purchase', {
      transaction_id: transactionId,
      value,
      currency,
      items: [
        {
          item_id: registration.ticket.id,
          item_name: registration.ticket.name,
          item_category: 'event_ticket',
        },
      ],
    })

    analyticsWindow.fbq?.(
      'track',
      'Purchase',
      {
        value,
        currency,
        content_name: registration.event.title,
        content_ids: [registration.ticket.id],
        content_type: 'product',
      },
      { eventID: eventId },
    )
  }, [data?.registration])

  useEffect(() => {
    if (!hasReference) {
      router.replace(`/events/${params.id}`)
    }
  }, [hasReference, params.id, router])

  if (!hasReference) {
    return null
  }

  if (sessionLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-sm text-muted-foreground">Validation du paiement…</div>
      </main>
    )
  }

  if (error || !data?.registration) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-lg px-6 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Impossible de confirmer l'inscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{error?.message || 'Nous ne retrouvons pas cette session.'}</p>
              <Button onClick={() => refetch()}>Réessayer</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const { registration } = data
  const startTimeLabel = formatClockTimeParis(registration.start_time)
  const assignmentBreached = Boolean(registration.assignment_constraint_breached)

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-50/30 dark:from-green-950/20 dark:via-background dark:to-green-950/10">
      {/* Confetti animation effect */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-10 left-1/4 h-32 w-32 animate-pulse rounded-full bg-green-200/30 blur-3xl" />
        <div className="absolute right-1/4 top-20 h-40 w-40 animate-pulse rounded-full bg-yellow-200/20 blur-3xl" />
        <div className="absolute bottom-20 left-1/3 h-36 w-36 animate-pulse rounded-full bg-orange-200/20 blur-3xl" />
      </div>

      <div className="container relative mx-auto max-w-4xl p-6">
        <div className="mb-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="animate-bounce rounded-full bg-gradient-to-br from-green-100 to-green-200 p-6 shadow-2xl shadow-green-500/20 dark:from-green-900 dark:to-green-800">
              <CheckCircle className="h-20 w-20 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="mb-4 bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-4xl font-black text-transparent lg:text-6xl">
            C'EST DANS LA POCHE ! 🎉
          </h1>
          <p className="text-xl font-medium text-muted-foreground lg:text-2xl">
            Tu es officiellement inscrit·e ! <br />
            <span className="text-primary">Prépare-toi à te dépasser.</span>
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Badge className="bg-green-500 px-4 py-1.5 text-sm font-semibold">Paiement validé</Badge>
            <Badge variant="outline" className="px-4 py-1.5 text-sm font-semibold">Place confirmée</Badge>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Détails de votre inscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold">{registration.event.title}</h3>
                {registration.event.subtitle ? (
                  <p className="mb-3 text-muted-foreground">{registration.event.subtitle}</p>
                ) : null}
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>
                      {new Date(registration.event.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {' à '}
                      {new Date(registration.event.date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{registration.event.location}</span>
                  </div>
                  {startTimeLabel ? (
                    <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-primary" />
                      <span>Départ prévu : {startTimeLabel}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-3 font-medium">Votre format</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Ticket :</span>
                    <span className="font-medium">{registration.ticket.name}</span>
                  </div>
                  {registration.ticket.race ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span>Course :</span>
                        <Badge
                          variant="outline"
                          className={getDifficultyColor(registration.ticket.race.difficulty)}
                        >
                          {registration.ticket.race.name}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Distance :</span>
                        <span>{registration.ticket.race.distance_km} km</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Difficulté :</span>
                        <span>{registration.ticket.race.difficulty}/10</span>
                      </div>
                    </>
                  ) : null}
                  <div className="flex items-center justify-between border-t pt-2 text-lg font-medium">
                    <span>Total payé :</span>
                    <span className="text-primary">
                      {formatPrice(registration.order.amount_total, registration.order.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Confirmation envoyée
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Un e-mail de confirmation contenant votre billet et les informations de course a été
                  envoyé à l'adresse associée.
                </p>
                <p>Vous pouvez retrouver ce billet à tout moment dans votre espace compte.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Étapes suivantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Pensez à télécharger votre billet et arriver en avance le jour J.</p>
                {startTimeLabel ? (
                  <p>
                    Votre départ est prévu à {startTimeLabel}. Présentez-vous au minimum 1h avant.
                  </p>
                ) : null}
                {assignmentBreached ? (
                  <p className="text-amber-700">
                    Ce créneau a été attribué en dehors de votre préférence pour garantir une place.
                  </p>
                ) : null}
                <div className="flex gap-2">
                  <Link href={`/account/tickets?ticket=${registration.id}`}>
                    <Button size="sm">
                      <QrCode className="mr-2 h-4 w-4" /> Voir mon billet
                    </Button>
                  </Link>
                  <Link href={`/events/${params.id}`}>
                    <Button variant="outline" size="sm">
                      Retour à l'événement
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Récapitulatif paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Montant réglé</span>
                  <span className="font-medium text-foreground">
                    {formatPrice(registration.order.amount_total, registration.order.currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
