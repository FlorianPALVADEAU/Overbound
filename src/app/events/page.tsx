'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Calendar, MapPin, Navigation, Ticket as TicketIcon, Timer, ArrowLeft, Star, Mountain, Users, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Headings from '@/components/globals/Headings'
import { useGetEventsWithTickets } from '../api/events/eventsQueries'
import type { EventWithTickets } from '@/types/Event'
import type { Ticket as TicketType } from '@/types/Ticket'
import type { EventStatus } from '@/types/base.type'
import Link from 'next/link'
import ObstaclesPage from '../obstacles/page'
import ObstaclesOverview from '@/components/homepage/ObstaclesOverview'
import FAQ from '@/components/homepage/FAQ'
import SubHeadings from '@/components/globals/SubHeadings'
import WhichDistanceForMe from '@/components/WhichDistanceForMe'
import AnimatedBanner from '@/components/homepage/AnimatedBanner'
import { PARTNERS_DATA } from '@/datas/Partners'
import { v4 as uuid } from 'uuid'
import EventlistDisplay from '@/components/events/EventlistDisplay'
import NeedHelpChoosingYourFormat from '@/components/homepage/NeedHelpChoosingYourFormat'

const renderEventTicket = (ticket: TicketType | null, selectedEvent: EventWithTickets) => (
  <div key={ticket?.id || uuid()}>
    {ticket ? (
      <div
        key={ticket.id}
        className="rounded-lg border border-border bg-background p-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-semibold text-base mb-1">
              {ticket.name}
            </h4>
            {ticket.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {ticket.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {formatDistance(ticket.distance_km) && (
                <Badge variant="outline" className="text-xs">
                  <Mountain className="h-3 w-3 mr-1" />
                  {formatDistance(ticket.distance_km)}
                </Badge>
              )}
              {ticket.max_participants && (
                <Badge variant="outline" className="text-xs">
                  Places : {ticket.max_participants}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-primary mb-2">
              {formatTicketPrice(ticket)}
            </div>
            <Link href={`/events/${selectedEvent.id}/register?ticket=${ticket.id}`}>
              <Button size="sm" className="w-full">
                S'inscrire
              </Button>
            </Link>
          </div>
        </div>
        
        {(ticket.sales_start || ticket.sales_end) && (
          <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
            {ticket.sales_start && (
              <span className="mr-4">
                Ouverture : {formatEventDateShort(ticket.sales_start)}
              </span>
            )}
            {ticket.sales_end && (
              <span>
                Clôture : {formatEventDateShort(ticket.sales_end)}
              </span>
            )}
          </div>
        )}
      </div>
    ) : (
      <div
        key="volunteer-ticket"
        className="rounded-lg border border-border bg-background p-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-semibold text-base mb-1">
              Devenir bénévole
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Rejoignez la tribu organisatrice en tant que bénévole et vivez une expérience unique !
            </p>
          </div>
        </div>
        <div className="text-right">
          <Link href={`/volunteers#rejoindre`}>
            <Button size="sm" className="w-full">S'inscrire</Button>
          </Link>
        </div>
      </div>
    )}
  </div>
)

const EventsMap = dynamic(() => import('@/components/events/EventsMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
      Chargement de la carte...
    </div>
  )
})

const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Bientôt disponible',
  on_sale: 'Inscriptions ouvertes',
  sold_out: 'Complet',
  cancelled: 'Événement annulé',
  completed: 'Événement passé',
  closed: 'Inscriptions closes'
}

const EVENT_STATUS_STYLES: Record<EventStatus, string> = {
  draft: 'border-slate-200 bg-slate-50 text-slate-600',
  on_sale: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  sold_out: 'border-amber-200 bg-amber-50 text-amber-700',
  cancelled: 'border-red-200 bg-red-50 text-red-700',
  completed: 'border-blue-200 bg-blue-50 text-blue-700',
  closed: 'border-gray-200 bg-gray-50 text-gray-700'
}

const formatEventDateLong = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date à confirmer'
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

const formatEventDateShort = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'À confirmer'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short'
  }).format(date)
}

const formatEventTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatTicketPrice = (ticket: TicketType | null | undefined) => {
  if (!ticket?.base_price_cents || !ticket.currency) return 'Tarif communiqué prochainement'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: ticket.currency.toUpperCase()
  }).format(ticket.base_price_cents / 100)
}

const formatDistance = (distance: number | null) => {
  if (distance === null || distance === undefined) return null
  return `${distance.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`
}

const getDifficultyColor = (difficulty: number) => {
  if (difficulty <= 3) return 'bg-green-100 text-green-800'
  if (difficulty <= 6) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

const startOfToday = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

const EventsSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="rounded-2xl border border-border bg-background p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="mt-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    ))}
  </div>
)

export default function EventsPage() {
  const { data, isLoading, isError, error, isFetching } = useGetEventsWithTickets()
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const upcomingEvents = useMemo(() => {
    if (!data) return [] as EventWithTickets[]
    const referenceDate = startOfToday()

    return data
      .filter((event) => {
        const eventDate = new Date(event.date)
        if (Number.isNaN(eventDate.getTime())) return true
        return eventDate >= referenceDate
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data])

  const eventsWithCoordinates = useMemo(
    () =>
      upcomingEvents.filter(
        (event) => Number.isFinite(event.latitude) && Number.isFinite(event.longitude)
      ),
    [upcomingEvents]
  )

  useEffect(() => {
    if (!upcomingEvents.length) {
      setSelectedEventId(null)
      return
    }

    // Vérifier si l'événement sélectionné existe encore
    if (selectedEventId) {
      const stillAvailable = upcomingEvents.some((event) => event.id === selectedEventId)
      if (!stillAvailable) {
        setSelectedEventId(null)
      }
    }
  }, [upcomingEvents, selectedEventId])

  const selectedEvent = useMemo(
    () => upcomingEvents.find((event) => event.id === selectedEventId) ?? null,
    [selectedEventId, upcomingEvents]
  )

  const handleBackToList = () => {
    setSelectedEventId(null)
  }

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="w-full container mx-auto py-10 px-4 sm:px-10">
        <section className="mb-12 text-center">
          <h1 className="sr-only">Événements Overbound</h1>
          <Headings
            title="Partez à la conquête de nos prochains défis"
            description="Visualisez nos événements sur la carte, trouvez les courses proches de chez vous et plongez dans les détails de chaque ticket disponible."
          />
        </section>

        {isError && (
          <div className="mb-10 rounded-2xl border border-red-200 bg-red-50 p-6 text-left text-red-700">
            Une erreur est survenue lors du chargement des événements : {error?.message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 mb-8">
          {/* Barre de gauche - Liste ou Détail */}
          <section className="h-full order-2 lg:order-1 lg:col-span-2">
            {selectedEvent ? (
              /* Mode Détail - Événement sélectionné */
              <div className="h-full space-y-6">
                <Card className="border border-border">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToList}
                        className="p-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex-1">
                        <CardTitle className="text-xl font-semibold leading-tight">
                          {selectedEvent.title}
                        </CardTitle>
                        {selectedEvent.subtitle && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedEvent.subtitle}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`${EVENT_STATUS_STYLES[selectedEvent.status]} text-xs font-medium`}
                      >
                        {EVENT_STATUS_LABELS[selectedEvent.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formatEventDateLong(selectedEvent.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formatEventTime(selectedEvent.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedEvent.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedEvent.capacity} places disponibles</span>
                      </div>
                    </div>

                    {selectedEvent.description && (
                      <div>
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          Description
                        </h3>
                        <p className="text-sm leading-relaxed text-foreground/80">
                          {selectedEvent.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tickets disponibles */}
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Formats disponibles ({selectedEvent.tickets?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedEvent.tickets && selectedEvent.tickets.length ? (
                      <div className="space-y-4">
                        {selectedEvent.tickets.map((ticket) => (
                          renderEventTicket(ticket, selectedEvent)
                        ))}
                        {renderEventTicket(null, selectedEvent)}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border/60 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                        Les informations sur les tickets seront bientôt disponibles.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Mode Liste - Preview des événements */
              <Card className="h-full border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Timer className="h-5 w-5 text-primary" />
                    Événements à venir ({upcomingEvents.length})
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Cliquez sur un événement pour voir les détails et les tickets disponibles
                  </p>
                </CardHeader>
                <CardContent className="max-h-[640px] space-y-3 overflow-y-auto pr-2">
                  {isLoading && !data ? (
                    <EventsSkeleton />
                  ) : upcomingEvents.length ? (
                    upcomingEvents.map((event) => {
                      const ticketsCount = event.tickets?.length ?? 0
                      const statusLabel = EVENT_STATUS_LABELS[event.status]
                      const statusClasses = EVENT_STATUS_STYLES[event.status]
                      const minPrice = event.tickets && event.tickets.length > 0 
                        ? Math.min(...event.tickets.map(t => t.base_price_cents || 0))
                        : null

                      return (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => handleEventSelect(event.id)}
                          className="group w-full rounded-lg border border-border bg-background p-4 text-left transition-all hover:border-primary/20 hover:bg-primary/5 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-base leading-tight mb-1">
                                {event.title}
                              </h3>
                              {event.subtitle && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {event.subtitle}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className={`${statusClasses} whitespace-nowrap text-xs font-medium`}>
                              {statusLabel}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatEventDateShort(event.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </span>
                            </div>
                            
                            <div className="text-right">
                              {minPrice && minPrice > 0 && (
                                <div className="text-sm font-semibold text-primary">
                                  dès {(minPrice / 100).toFixed(0)}€
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                {ticketsCount} format{ticketsCount > 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-border/60 bg-background p-6 text-center text-muted-foreground">
                      Aucun événement à afficher pour le moment. Revenez bientôt !
                    </div>
                  )}

                  {!isLoading && isFetching && (
                    <p className="text-center text-xs text-muted-foreground">
                      Mise à jour des données...
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </section>

          {/* Carte à droite */}
          <section className="order-1 lg:order-2 lg:col-span-3">
            <div className="relative h-[420px] overflow-hidden rounded-3xl border border-border bg-muted lg:h-[640px]">
              {isLoading && !eventsWithCoordinates.length ? (
                <Skeleton className="h-full w-full" />
              ) : eventsWithCoordinates.length ? (
                <EventsMap
                  events={eventsWithCoordinates}
                  selectedEventId={selectedEventId}
                  onSelectEvent={setSelectedEventId}
                />
              ) : (
                <div className="flex h-full items-center justify-center p-10 text-center text-muted-foreground">
                  <div>
                    <Navigation className="mx-auto mb-4 h-10 w-10" />
                    <p className="text-base font-medium">Aucun événement géolocalisé disponible pour le moment.</p>
                    <p className="text-sm text-muted-foreground">
                      Dès que nous aurons des épreuves géolocalisées, elles apparaîtront ici.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <NeedHelpChoosingYourFormat />
      </div>
      <EventlistDisplay />
      <ObstaclesOverview />
      <FAQ />
      <AnimatedBanner images={PARTNERS_DATA.map(partner => partner.logo)} />
    </main>
  )
}