import { safeJsonStringify } from '@/lib/safeJson'
import { calculateCurrentPrice, getCurrentPriceTier, type EventPriceTier } from '@/types/EventPriceTier'

type TicketOffer = {
  name?: string | null
  final_price_cents?: number | null
  currency?: string | null
}

type EventStructuredDataInput = {
  title: string
  description?: string | null
  date: string
  location: string
  status?: string | null
  slug?: string | null
  image_url?: string | null
  sales_start?: string | null
  tickets?: TicketOffer[] | null
  price_tiers?: EventPriceTier[] | null
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'

const fallbackImage = `${siteUrl}/images/images/overbound-og-cover.jpg`

const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return fallbackImage
  if (value.startsWith('http')) return value
  return `${siteUrl}${value}`
}

const toCurrency = (value?: string | null) => {
  if (!value) return 'EUR'
  return value.toUpperCase()
}

const toAvailability = (status?: string | null) => {
  switch (status) {
    case 'sold_out':
      return 'https://schema.org/SoldOut'
    case 'announced':
      return 'https://schema.org/PreOrder'
    case 'closed':
    case 'completed':
      return 'https://schema.org/OutOfStock'
    case 'cancelled':
      return 'https://schema.org/Discontinued'
    default:
      return 'https://schema.org/InStock'
  }
}

const toEventStatus = (status?: string | null) => {
  switch (status) {
    case 'cancelled':
      return 'https://schema.org/EventCancelled'
    default:
      return 'https://schema.org/EventScheduled'
  }
}

export function EventStructuredDataServer({ event }: { event: EventStructuredDataInput }) {
  const canonical = `${siteUrl}/events/${event.slug ?? ''}`.replace(/\/$/, '')
  const imageUrl = toAbsoluteUrl(event.image_url)
  const availability = toAvailability(event.status)

  // Same price as the page shows: base price minus the active tier discount.
  const activeTier = getCurrentPriceTier(event.price_tiers ?? [])
  const offers = (event.tickets ?? [])
    .filter((ticket) => typeof ticket.final_price_cents === 'number')
    .map((ticket) => ({
      '@type': 'Offer',
      name: ticket.name || event.title,
      price: Math.max(calculateCurrentPrice(ticket.final_price_cents as number, activeTier), 0) / 100,
      priceCurrency: toCurrency(ticket.currency),
      availability,
      validFrom: event.sales_start || undefined,
      url: canonical,
    }))

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: event.title,
    description: event.description || undefined,
    startDate: event.date,
    eventStatus: toEventStatus(event.status),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: [imageUrl],
    location: {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.location,
        addressCountry: 'FR',
      },
    },
    organizer: {
      '@type': 'SportsOrganization',
      name: 'Overbound Race',
      url: siteUrl,
      logo: `${siteUrl}/images/brand/LOGO_FULL.png`,
    },
    offers: offers.length > 0 ? offers : undefined,
    url: canonical,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonStringify(structuredData) }}
    />
  )
}
