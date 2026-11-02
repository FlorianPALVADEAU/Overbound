'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronRight, MapPin } from 'lucide-react'
import { useAdminEvents } from '@/app/api/admin/events/eventsQueries'
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { formatEventDate } from '@/components/admin/events/AdminEventContextSelector'

interface AdminEventPickerProps {
  title: string
  description: string
  /** Where an event leads, e.g. its participants. */
  hrefFor: (eventId: string) => string
}

/** Pages that work on one event: pick it here when the top bar has none selected. A single event is opened directly. */
export function AdminEventPicker({ title, description, hrefFor }: AdminEventPickerProps) {
  const router = useRouter()
  const { data: events = [], isLoading, error } = useAdminEvents()
  const onlyEventId = events.length === 1 ? events[0].id : null

  useEffect(() => {
    if (onlyEventId) router.replace(hrefFor(onlyEventId))
    // hrefFor is a fresh function each render; the target only depends on the event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyEventId, router])

  return (
    <div className="space-y-6">
      <AdminPageHeader eyebrow="Billetterie" title={title} description={description} />
      {isLoading || onlyEventId ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun événement. Crée-en un depuis la page Événements.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {events.map((event) => (
            <Link key={event.id} href={hrefFor(event.id)} className="group">
              <Card variant="info" className="transition-colors duration-200 ease-standard group-hover:border-primary/60">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-medium">{event.title}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />{formatEventDate(event)}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" />{event.location}</p>
                    <p className="text-xs text-muted-foreground">{(event.registrations_count ?? 0).toLocaleString('fr-FR')} inscrits</p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground group-hover:text-primary" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
