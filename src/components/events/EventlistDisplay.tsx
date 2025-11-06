import { useMemo } from 'react'
import Link from 'next/link'
import { CalendarDays, MapPin, Ticket as TicketIcon, ArrowRight, Users } from 'lucide-react'
import { useGetEventsWithTickets } from '@/app/api/events/eventsQueries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { EventWithTickets } from '@/types/Event'
import type { Ticket } from '@/types/Ticket'

const statusVariant = (status: string) => {
  switch (status) {
    case 'on_sale':
      return 'default' as const
    case 'sold_out':
      return 'destructive' as const
    case 'cancelled':
      return 'outline' as const
    case 'completed':
      return 'secondary' as const
    default:
      return 'secondary' as const
  }
}

const statusLabel = (status: string) => {
  switch (status) {
    case 'on_sale':
      return 'Inscriptions ouvertes'
    case 'sold_out':
      return 'Complet'
    case 'cancelled':
      return 'Annulé'
    case 'completed':
      return 'Terminé'
    case 'draft':
      return 'À confirmer'
    case 'closed':
      return 'Clôturé'
    default:
      return status
  }
}

const formatEventDate = (value: string | null | undefined) => {
  if (!value) return 'Date à confirmer'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date à confirmer'
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const formatCurrency = (value: number, currency?: string | null) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: (currency ?? 'EUR').toUpperCase(),
    maximumFractionDigits: 0,
  }).format(value / 100)

const findStartingPrice = (tickets: Ticket[] | null | undefined) => {
  if (!tickets || tickets.length === 0) return null
  const withPrice = tickets.filter((ticket) => typeof ticket.base_price_cents === 'number')
  if (withPrice.length === 0) return null
  const cheapest = withPrice.reduce((lowest, ticket) => {
    if (ticket.base_price_cents == null) return lowest
    return ticket.base_price_cents < lowest ? ticket.base_price_cents : lowest
  }, withPrice[0].base_price_cents ?? 0)
  if (cheapest == null) return null
  const currency = withPrice.find((ticket) => ticket.base_price_cents === cheapest)?.currency ?? 'EUR'
  return { amount: cheapest, currency }
}

const EventSkeleton = () => (
  <Card className='border border-border/60 bg-background/70 shadow-sm shadow-primary/5'>
    <CardHeader className='space-y-3'>
      <Skeleton className='h-5 w-3/4' />
      <Skeleton className='h-4 w-1/2' />
    </CardHeader>
    <CardContent className='space-y-3'>
      <Skeleton className='h-4 w-2/3' />
      <Skeleton className='h-4 w-1/3' />
      <Skeleton className='h-10 w-full' />
    </CardContent>
  </Card>
)

const EmptyState = () => (
  <Card className='border border-dashed border-border/60 bg-background/80 shadow-inner'>
    <CardContent className='space-y-4 p-10 text-center text-sm text-muted-foreground'>
      <p className='text-base font-medium text-foreground'>Aucune course à venir pour le moment</p>
      <p>Reviens bientôt ou inscris-toi à notre newsletter pour être prévenu en avant-première.</p>
      <Button asChild variant='outline' size='sm' className='mx-auto w-fit border-primary text-primary hover:bg-primary/10'>
        <Link href='/events'>Voir toutes les courses</Link>
      </Button>
    </CardContent>
  </Card>
)

const EventlistDisplay = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useGetEventsWithTickets()

  const upcomingEvents = useMemo(() => {
    if (!data) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return data
      .filter((event) => {
        if (!event.date) return false
        const eventDate = new Date(event.date)
        if (Number.isNaN(eventDate.getTime())) return false
        return eventDate >= today
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data])

  if (isError) {
    return (
      <section className='w-full bg-background/95 py-16 sm:py-20'>
        <div className='mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 text-center'>
          <p className='text-sm text-muted-foreground'>
            {error?.message ?? 'Impossible de charger les événements pour le moment.'}
          </p>
          <Button onClick={() => refetch()} variant='outline'>
            Réessayer
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className='relative w-full bg-gradient-to-b from-background via-muted/10 to-background py-16 sm:py-20'>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-0'>
        <header className='space-y-4 text-center sm:text-left'>
          <span className='inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-primary sm:text-sm'>
            Calendrier Overbound
          </span>
          <div className='space-y-3'>
            <h2 className='text-3xl font-semibold text-foreground sm:text-4xl'>Les prochains défis à ne pas manquer</h2>
            <p className='mx-auto max-w-2xl text-sm text-muted-foreground sm:mx-0 sm:text-base'>
              Sélectionne ta prochaine course, repère les lieux et assure-toi une place avant la clôture des inscriptions.
              Chaque carte te donne l’essentiel : date, lieu, prix de départ et nombre de formats disponibles.
            </p>
          </div>
        </header>

        <div className='space-y-4 text-right text-xs text-muted-foreground sm:text-sm'>
          {isFetching ? <span>Actualisation des événements…</span> : null}
        </div>

        {isLoading ? (
          <div className='grid gap-6 sm:grid-cols-2'>
            {Array.from({ length: 4 }).map((_, index) => (
              <EventSkeleton key={`event-skeleton-${index}`} />
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <EmptyState />
        ) : (
          <div className='grid gap-6 sm:grid-cols-2'>
            {upcomingEvents.map((event: EventWithTickets) => {
              const startingPrice = findStartingPrice(event.tickets)
              const ticketCount = event.tickets?.length ?? 0
              return (
                <Card
                  key={event.id}
                  className='group flex h-full flex-col justify-between border border-border/60 bg-background/80 shadow-lg shadow-primary/5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-primary/20'
                >
                  <CardHeader className='space-y-4'>
                    <div className='flex flex-wrap items-center justify-between gap-3'>
                      <CardTitle className='text-xl font-semibold text-foreground'>{event.title}</CardTitle>
                      <Badge variant={statusVariant(event.status)} className='capitalize'>
                        {statusLabel(event.status)}
                      </Badge>
                    </div>
                    {event.subtitle ? (
                      <p className='text-sm text-muted-foreground'>{event.subtitle}</p>
                    ) : null}
                  </CardHeader>

                  <CardContent className='flex flex-1 flex-col justify-between space-y-6 text-sm text-muted-foreground'>
                    <div className='space-y-3'>
                      <div className='flex items-center gap-2'>
                        <CalendarDays className='h-4 w-4 text-primary' />
                        <span>{formatEventDate(event.date)}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <MapPin className='h-4 w-4 text-primary' />
                        <span>{event.location ?? 'Lieu à confirmer'}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <TicketIcon className='h-4 w-4 text-primary' />
                        <span>
                          {ticketCount > 0
                            ? `${ticketCount} format${ticketCount > 1 ? 's' : ''} disponible${ticketCount > 1 ? 's' : ''}`
                            : 'Formules à venir'}
                        </span>
                      </div>
                      {startingPrice ? (
                        <div className='flex items-center gap-2 text-base font-semibold text-foreground'>
                          <Users className='h-4 w-4 text-primary' />
                          <span>À partir de {formatCurrency(startingPrice.amount, startingPrice.currency)}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className='flex items-center justify-between gap-3'>
                      <div className='text-xs uppercase tracking-[0.3em] text-muted-foreground'>
                        {event.slug ? `#${event.slug}` : `#${event.id.slice(0, 8)}`}
                      </div>
                      <Button asChild size='sm' className='group/button'>
                        <Link href={`/events/${event.id}`} className='flex items-center gap-2'>
                          Découvrir
                          <ArrowRight className='h-4 w-4 transition group-hover/button:translate-x-1' />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default EventlistDisplay
