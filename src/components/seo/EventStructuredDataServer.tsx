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
  tickets?: TicketOffer[] | null
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'

const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return undefined
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
    case 'completed':
      return 'https://schema.org/EventCompleted'
    case 'announced':
      return 'https://schema.org/EventScheduled'
    default:
      return 'https://schema.org/EventScheduled'
  }
}

export function EventStructuredDataServer({ event }: { event: EventStructuredDataInput }) {
  const canonical = `${siteUrl}/events/${event.slug ?? ''}`.replace(/\/$/, '')
  const imageUrl = toAbsoluteUrl(event.image_url)
  const availability = toAvailability(event.status)

  const offers =
    event.tickets?.map((ticket) => ({
      '@type': 'Offer',
      name: ticket.name || event.title,
      price:
        typeof ticket.final_price_cents === 'number'
          ? Math.max(ticket.final_price_cents, 0) / 100
          : undefined,
      priceCurrency: toCurrency(ticket.currency),
      availability,
      url: canonical,
    })) || []

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: event.title,
    description: event.description || undefined,
    startDate: event.date,
    eventStatus: toEventStatus(event.status),
    image: imageUrl ? [imageUrl] : undefined,
    location: {
      '@type': 'Place',
      name: event.location,
    },
    organizer: {
      '@type': 'SportsOrganization',
      name: 'Overbound Race',
      url: siteUrl,
    },
    offers: offers.length > 0 ? offers : undefined,
    url: canonical,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
