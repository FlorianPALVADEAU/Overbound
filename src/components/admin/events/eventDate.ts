import type { AdminEventSummary } from '@/app/api/admin/events/eventsQueries'

/** Event date in the event's own timezone when it has one, otherwise in the browser's. */
export const formatEventDate = (event: AdminEventSummary) => {
  const timezone = (event as AdminEventSummary & { timezone?: string | null }).timezone ?? undefined
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...(timezone ? { timeZone: timezone, timeZoneName: 'short' as const } : {}),
  }).format(new Date(event.date))
}
