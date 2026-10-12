'use client'

import Link from 'next/link'
import { Calendar, Clock, Download, Mail, MapPin, QrCode, Trophy, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatClockTimeParis } from '@/lib/dateTime'
import { PurchaseCelebration } from './PurchaseCelebration'

export interface SuccessOrderRegistration {
  id: string
  email: string | null
  race_format: string | null
  start_time: string | null
  ticket: { id: string; name: string } | null
}

export interface SuccessRegistration {
  id: string
  start_time?: string | null
  assignment_constraint_breached?: boolean | null
  event: { id: string; slug: string; title: string; subtitle?: string | null; date: string; location: string }
  ticket: {
    id: string
    name: string
    race?: { name: string; difficulty: number; distance_km: number } | null
  } | null
  order: { id: string; amount_total: number; currency: string }
}

interface EventSuccessViewProps {
  registration: SuccessRegistration
  /** Every registration of the order (a group purchase can hold many). */
  registrations: SuccessOrderRegistration[]
  eventSlug: string
  hasFirstName: boolean
  /** Dev preview only. */
  preview?: boolean
}

const formatPrice = (priceInCents: number, currency: string) =>
  (priceInCents / 100).toLocaleString('fr-FR', { style: 'currency', currency: currency.toUpperCase() })

const getDifficultyColor = (difficulty: number) => {
  if (difficulty <= 3) return 'bg-green-100 text-green-800'
  if (difficulty <= 6) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

// Label / value row that never forces horizontal scroll on narrow screens.
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0">{label}</span>
      <span className="min-w-0 break-words text-right">{children}</span>
    </div>
  )
}

export function EventSuccessView({
  registration,
  registrations,
  eventSlug,
  hasFirstName,
  preview = false,
}: EventSuccessViewProps) {
  const teamSize = Math.max(registrations.length, 1)
  const isGroup = teamSize > 1
  const startTimeLabel = formatClockTimeParis(registration.start_time)
  const assignmentBreached = Boolean(registration.assignment_constraint_breached)

  return (
    <main className="min-h-screen overflow-x-clip bg-background">
      <div className="container relative mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-balance break-words text-3xl font-black text-foreground sm:text-4xl lg:text-6xl">
            C'EST DANS LA POCHE ! 🎉
          </h1>
          <p className="text-lg font-medium text-muted-foreground sm:text-xl lg:text-2xl">
            {isGroup ? `Vos ${teamSize} places sont confirmées !` : 'Tu es officiellement inscrit·e !'} <br />
            <span className="text-primary">Prépare-toi à te dépasser.</span>
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Badge className="bg-green-500 px-4 py-1.5 text-sm font-semibold">Paiement validé</Badge>
            <Badge variant="outline" className="px-4 py-1.5 text-sm font-semibold">
              {isGroup ? `${teamSize} places confirmées` : 'Place confirmée'}
            </Badge>
          </div>
        </div>

        <div className="mb-12">
          <PurchaseCelebration
            registrationId={registration.id}
            eventSlug={eventSlug}
            eventTitle={registration.event.title}
            hasFirstName={hasFirstName}
            preview={preview}
            previewTeamSize={preview ? teamSize : undefined}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 shrink-0" />
                {isGroup ? `Vos ${teamSize} inscriptions` : 'Détails de votre inscription'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-2 break-words text-lg font-semibold">{registration.event.title}</h3>
                {registration.event.subtitle ? (
                  <p className="mb-3 text-muted-foreground">{registration.event.subtitle}</p>
                ) : null}
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 break-words">
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
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 break-words">{registration.event.location}</span>
                  </div>
                  {!isGroup && startTimeLabel ? (
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>Départ prévu : {startTimeLabel}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {isGroup ? (
                <div className="border-t pt-4">
                  <h4 className="mb-3 flex items-center gap-2 font-medium">
                    <Users className="h-4 w-4 shrink-0" />
                    Participants
                  </h4>
                  <ul className="divide-y">
                    {registrations.map((item, index) => {
                      const itemStart = formatClockTimeParis(item.start_time)
                      return (
                        <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5">
                          <span className="min-w-0 break-all text-sm">
                            {index + 1}. {item.email ?? 'Participant'}
                          </span>
                          <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                            {item.race_format ? (
                              <Badge variant="outline" className="uppercase">
                                {item.race_format}
                              </Badge>
                            ) : null}
                            {itemStart ? <span>{itemStart}</span> : null}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <h4 className="mb-3 font-medium">Votre format</h4>
                  <div className="space-y-2">
                    <Row label="Ticket :">
                      <span className="font-medium">{registration.ticket?.name}</span>
                    </Row>
                    {registration.ticket?.race ? (
                      <>
                        <Row label="Course :">
                          <Badge
                            variant="outline"
                            className={getDifficultyColor(registration.ticket.race.difficulty)}
                          >
                            {registration.ticket.race.name}
                          </Badge>
                        </Row>
                        <Row label="Distance :">{registration.ticket.race.distance_km} km</Row>
                        <Row label="Difficulté :">{registration.ticket.race.difficulty}/10</Row>
                      </>
                    ) : null}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 border-t pt-4 text-lg font-medium">
                <span>{isGroup ? `Total payé (${teamSize} places) :` : 'Total payé :'}</span>
                <span className="shrink-0 text-primary">
                  {formatPrice(registration.order.amount_total, registration.order.currency)}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="min-w-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 shrink-0" />
                  {isGroup ? 'Confirmations envoyées' : 'Confirmation envoyée'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {isGroup
                    ? 'Chaque participant reçoit son billet et les informations de course à son adresse e-mail.'
                    : "Un e-mail de confirmation contenant votre billet et les informations de course a été envoyé à l'adresse associée."}
                </p>
                <p>Vous pouvez retrouver {isGroup ? 'ces billets' : 'ce billet'} à tout moment dans votre espace compte.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 shrink-0" />
                  Étapes suivantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Pensez à télécharger {isGroup ? 'vos billets' : 'votre billet'} et arriver en avance le jour J.</p>
                {!isGroup && startTimeLabel ? (
                  <p>Votre départ est prévu à {startTimeLabel}. Présentez-vous au minimum 1h avant.</p>
                ) : null}
                {assignmentBreached ? (
                  <p className="text-amber-700">
                    Ce créneau a été attribué en dehors de votre préférence pour garantir une place.
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" className="min-h-11">
                    <Link href={isGroup ? '/account/tickets' : `/account/tickets?ticket=${registration.id}`}>
                      <QrCode className="mr-2 h-4 w-4" /> {isGroup ? 'Voir mes billets' : 'Voir mon billet'}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="min-h-11">
                    <Link href={`/events/${eventSlug}`}>Retour à l'événement</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
