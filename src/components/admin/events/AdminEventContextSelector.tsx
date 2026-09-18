'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CalendarDays, ChevronRight, Loader2, MapPin, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAdminEvents, type AdminEventSummary } from '@/app/api/admin/events/eventsQueries'

const EMPTY_EVENT_VALUE = '__no_event__'

const statusLabel = (status: AdminEventSummary['status']) => {
  switch (status) {
    case 'draft': return 'Brouillon'
    case 'announced': return 'Annoncé'
    case 'on_sale': return 'En vente'
    case 'sold_out': return 'Complet'
    case 'closed': return 'Clôturé'
    case 'cancelled': return 'Annulé'
    case 'completed': return 'Terminé'
    default: return status
  }
}

const formatEventDate = (event: AdminEventSummary) => {
  const timezone = (event as AdminEventSummary & { timezone?: string | null }).timezone ?? undefined
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...(timezone ? { timeZone: timezone, timeZoneName: 'short' as const } : {}),
  }).format(new Date(event.date))
}

interface AdminEventContextSelectorProps {
  eventId?: string | null
}

export function AdminEventContextSelector({ eventId }: AdminEventContextSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: events = [], isLoading, isError, error, refetch, isFetching } = useAdminEvents()
  const selectedEvent = events.find((event) => event.id === eventId)
  const hasAmbiguousContext = !eventId && events.length > 1

  if (isLoading) {
    return (
      <div aria-label="Chargement du contexte événement" className="flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement des événements…
      </div>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="flex items-center justify-between gap-3">
        <div>
          <AlertTitle>Contexte événement indisponible</AlertTitle>
          <AlertDescription>{error?.message ?? 'Impossible de charger les événements.'}</AlertDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Réessayer
        </Button>
      </Alert>
    )
  }

  if (events.length === 0) {
    return (
      <Alert>
        <AlertTitle>Aucun événement disponible</AlertTitle>
        <AlertDescription>Créez ou publiez un événement avant d’ouvrir une liste opérationnelle.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contexte événement</p>
          <p className="truncate text-sm font-medium">
            {selectedEvent ? selectedEvent.title : hasAmbiguousContext ? 'Sélection requise' : 'Aucun événement sélectionné'}
          </p>
        </div>
        <label className="flex min-w-0 items-center gap-2 text-sm">
          <span className="sr-only">Événement à administrer</span>
          <select
            aria-label="Événement à administrer"
            className="min-h-10 min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring lg:w-[24rem] lg:flex-none"
            value={selectedEvent?.id ?? EMPTY_EVENT_VALUE}
            onChange={(event) => {
              const params = new URLSearchParams(window.location.search)
              if (event.target.value === EMPTY_EVENT_VALUE) params.delete('event')
              else params.set('event', event.target.value)
              const query = params.toString()
              router.replace(`${pathname}${query ? `?${query}` : ''}`)
            }}
          >
            <option value={EMPTY_EVENT_VALUE}>{hasAmbiguousContext ? 'Choisir un événement…' : 'Aucun événement sélectionné'}</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} · {formatEventDate(event)} · {statusLabel(event.status)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedEvent ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatEventDate(selectedEvent)}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selectedEvent.location}</span>
          <span>{statusLabel(selectedEvent.status)}</span>
        </div>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          Sélectionnez explicitement un événement pour ouvrir ses participants ou son check-in.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="secondary" disabled={!selectedEvent}>
          <Link href={selectedEvent ? `?tab=members&event=${selectedEvent.id}` : '#'} aria-disabled={!selectedEvent} tabIndex={selectedEvent ? undefined : -1}>
            Participants <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="sm" variant="secondary" disabled={!selectedEvent}>
          <Link href={selectedEvent ? `?tab=checkin&event=${selectedEvent.id}` : '#'} aria-disabled={!selectedEvent} tabIndex={selectedEvent ? undefined : -1}>
            Check-in <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export { formatEventDate }
