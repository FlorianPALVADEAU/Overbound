'use client'

/* eslint-disable react/no-unescaped-entities */
import { useEffect } from 'react'
import { useSearchParams, useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  Calendar,
  MapPin,
  Mail,
  Download,
  Trophy,
  QrCode,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSession } from '@/app/api/session/sessionQueries'
import { useEventSuccess } from '@/app/api/events/[id]/success/successQueries'

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
  const hasSessionId = Boolean(sessionId)
  const { data: session, isLoading: sessionLoading } = useSession()
  const { data, isLoading, error, refetch } = useEventSuccess(params.id, sessionId, {
    enabled: Boolean(session?.user) && hasSessionId,
  })

  useEffect(() => {
    if (!hasSessionId) {
      router.replace(`/events/${params.id}`)
    }
  }, [hasSessionId, params.id, router])

  if (!hasSessionId) {
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-4xl p-6">
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold lg:text-4xl">Inscription confirmée ! 🎉</h1>
          <p className="text-xl text-muted-foreground">
            Votre paiement a été traité avec succès. Vous êtes maintenant inscrit à l'événement.
          </p>
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
                <p>
                  Pensez à télécharger votre billet, préparer vos documents si nécessaires et arriver en
                  avance le jour J.
                </p>
                <div className="flex gap-2">
                  <Link href={`/account/ticket/${registration.id}`}>
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
                {registration.ticket.requires_document ? (
                  <Alert>
                    <AlertDescription>
                      Votre ticket nécessite un document justificatif. Déposez-le depuis votre compte au plus vite.
                    </AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
