'use client'

import { useRouter, usePathname } from 'next/navigation'
import { CalendarDays, MapPin, X } from 'lucide-react'
import { useAdminEvents, type AdminEventSummary } from '@/app/api/admin/events/eventsQueries'
import { formatEventDate } from '@/components/admin/events/eventDate'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface OverviewEventContextProps {
  /** Event named in the URL (`?event=`). Null means the overview covers every event. */
  eventId: string | null
}

/**
 * The only place where an event is picked as a context. While one is set, the overview shows that event and
 * no picker: the admin removes the context first, then picks another one. Other pages pick their own event.
 */
export function OverviewEventContext({ eventId }: OverviewEventContextProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: events = [], isLoading, isError, error, refetch } = useAdminEvents()
  const selected = eventId ? events.find((event) => event.id === eventId) ?? null : null

  const setContext = (nextEventId: string | null) => {
    const params = new URLSearchParams(window.location.search)
    if (nextEventId) params.set('event', nextEventId)
    else params.delete('event')
    const query = params.toString()
    router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement des événements…</p>

  if (isError) {
    return (
      <p className="flex flex-wrap items-center gap-3 text-sm text-destructive">
        {error?.message ?? 'Impossible de charger les événements.'}
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>Réessayer</Button>
      </p>
    )
  }

  if (selected) return <ContextBanner event={selected} onClear={() => setContext(null)} />

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun événement. Crée-en un depuis la page Événements.</p>
  }

  return (
    <Card variant="info">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-label font-semibold uppercase text-subtle">Vue globale</p>
          <p className="text-sm text-muted-foreground">Tous les événements. Choisis-en un pour voir ses chiffres seulement.</p>
        </div>
        <label className="flex min-w-0 items-center gap-2 text-sm sm:w-96">
          <span className="sr-only">Contexte événement</span>
          <select
            aria-label="Contexte événement"
            className="min-h-10 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            value=""
            onChange={(change) => {
              if (change.target.value) setContext(change.target.value)
            }}
          >
            <option value="">Choisir un événement…</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} · {formatEventDate(event)}
              </option>
            ))}
          </select>
        </label>
      </CardContent>
    </Card>
  )
}

function ContextBanner({ event, onClear }: { event: AdminEventSummary; onClear: () => void }) {
  return (
    <Card variant="info" role="status" aria-label="Contexte événement actif">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-label font-semibold uppercase text-primary">Contexte actif</p>
          <p className="truncate font-medium">{event.title}</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden />{formatEventDate(event)}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{event.location}</span>
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onClear} className="w-full sm:w-auto">
          <X aria-hidden /> Retirer le contexte
        </Button>
      </CardContent>
    </Card>
  )
}
