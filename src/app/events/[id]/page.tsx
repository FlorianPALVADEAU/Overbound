'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import EventTicketListWithRegistration from '@/components/events/EventTicketListWithRegistration'
import { useEventDetail } from '@/app/api/events/[id]/eventDetailQueries'
import { useSession } from '@/app/api/session/sessionQueries'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'on_sale':
      return 'default'
    case 'sold_out':
      return 'destructive'
    case 'closed':
      return 'secondary'
    case 'draft':
      return 'outline'
    default:
      return 'outline'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'on_sale':
      return 'Inscriptions ouvertes'
    case 'sold_out':
      return 'Complet'
    case 'closed':
      return 'Inscriptions fermées'
    case 'draft':
      return 'Bientôt disponible'
    default:
      return status
  }
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const { data, isLoading, error, refetch } = useEventDetail(params.id)

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-sm text-muted-foreground">Chargement de l'événement…</div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-lg px-6 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Événement introuvable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{error?.message || "Cet événement n'existe pas ou n'est plus disponible."}</p>
              <Button onClick={() => refetch()}>Réessayer</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const { event, availableSpots, existingRegistration } = data
  const user = session?.user
  const isUpcoming = new Date(event.date) > new Date()
  const isToday = new Date(event.date).toDateString() === new Date().toDateString()
  const daysUntil = Math.ceil((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-7xl p-6">
        <div className="mb-6">
          <Link href="/events">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux événements
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col gap-8 lg:flex-row">
                <div className="flex-shrink-0">
                  <div className="relative h-48 w-full rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 lg:h-48 lg:w-64">
                    {event.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={event.image_url} alt={event.title} className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      <Calendar className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 text-primary/40" />
                    )}
                    <div className="absolute right-4 top-4">
                      <Badge variant={getStatusColor(event.status)}>{getStatusLabel(event.status)}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold lg:text-4xl">{event.title}</h1>
                    {event.subtitle ? <p className="text-lg text-muted-foreground">{event.subtitle}</p> : null}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span>
                        {new Date(event.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>{new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Users className="h-5 w-5 text-primary" />
                      <span>
                        {availableSpots > 0
                          ? `${availableSpots} place${availableSpots > 1 ? 's' : ''} disponible${availableSpots > 1 ? 's' : ''}`
                          : 'Complet'}
                      </span>
                    </div>
                  </div>

                  {isUpcoming ? (
                    <div className={isToday ? 'text-green-600' : 'text-muted-foreground'}>
                      {isToday
                        ? "C'est le grand jour !"
                        : `Plus que ${daysUntil} jour${daysUntil > 1 ? 's' : ''} avant le départ.`}
                    </div>
                  ) : null}

                  <div className="rounded-lg border border-dashed border-muted/50 bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">{event.description || "Aucune description pour le moment."}</p>
                  </div>

                  {user ? (
                    existingRegistration ? (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Vous avez déjà une inscription active avec le billet "{existingRegistration.tickets?.[0]?.name || '—'}".
                          Vous pouvez tout de même compléter une nouvelle inscription pour un autre billet ou participant.
                        </AlertDescription>
                      </Alert>
                    ) : availableSpots <= 0 ? (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>Les inscriptions ne sont plus disponibles pour cet événement.</AlertDescription>
                      </Alert>
                    ) : null
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Connectez-vous pour vous inscrire à l'événement.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <EventTicketListWithRegistration
          event={event}
          tickets={(event.tickets as any[] | undefined)?.map((ticket) => ({
            ...ticket,
            race: ticket.race ?? undefined,
          })) ?? []}
          availableSpots={availableSpots}
          user={user ? { id: user.id, email: user.email ?? '' } : null}
        />
      </div>
    </main>
  )
}
