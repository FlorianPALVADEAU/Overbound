import { buildBreadcrumbJsonLd, buildSportsEventJsonLd, type SportsEventInput } from '@/lib/seo/structuredData'
import { JsonLd } from './JsonLd'

export function EventStructuredDataServer({ event }: { event: SportsEventInput }) {
  return (
    <>
      <JsonLd data={buildSportsEventJsonLd(event)} />
      <JsonLd data={buildBreadcrumbJsonLd([{ name: event.title, path: `/events/${event.slug ?? ''}` }])} />
    </>
  )
}
