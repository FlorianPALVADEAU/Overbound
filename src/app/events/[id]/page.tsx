import { notFound } from 'next/navigation'
import { loadPublicEventDetail } from '@/lib/events/loadEventDetail'
import { EventDetailSeed } from './EventDetailSeed'
import { EventDetailView } from './EventDetailView'

// Rendered on the server and cached: the event, its tickets, prices and
// remaining spots are in the HTML. Regenerated at most every minute.
export const revalidate = 60

// No path is built ahead: each event page is rendered on first visit, then
// served from the cache.
export function generateStaticParams() {
  return []
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // A failed read falls back to the browser fetch, as before.
  const detail = await loadPublicEventDetail(id).catch((error) => {
    console.error('[event page] server read failed', id, error)
    return undefined
  })

  if (detail === null) notFound()

  const view = <EventDetailView eventId={id} />
  return detail ? (
    <EventDetailSeed eventId={id} data={detail}>
      {view}
    </EventDetailSeed>
  ) : (
    view
  )
}
