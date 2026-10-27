import { getCurrentTicketPrice } from '@/lib/pricing'
import type { Event } from '@/types/Event'
import type { Ticket } from '@/types/Ticket'
import type { EventPriceTier } from '@/types/EventPriceTier'

export interface FeaturedEventFacts {
  dateLabel: string
  location: string
  /** Lowest current ticket price in cents, null when no ticket is priced. */
  lowestPriceCents: number | null
  currency: string
  priceLabel: string | null
}

type EventWithOffer = Pick<Event, 'date' | 'location'> & {
  tickets?: Ticket[]
  price_tiers?: EventPriceTier[]
}

/** Date, place and "from" price of an event: the facts a visitor looks for first. */
export function getFeaturedEventFacts(event: EventWithOffer): FeaturedEventFacts {
  const tickets = event.tickets ?? []
  const priceTiers = event.price_tiers ?? []
  const prices = tickets
    .map((ticket) => getCurrentTicketPrice(ticket, priceTiers))
    .filter((price): price is number => typeof price === 'number')
  const lowestPriceCents = prices.length > 0 ? Math.min(...prices) : null
  const currency = (tickets.find((ticket) => ticket.currency)?.currency ?? 'EUR').toUpperCase()

  return {
    dateLabel: new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    location: event.location,
    lowestPriceCents,
    currency,
    priceLabel:
      lowestPriceCents === null
        ? null
        : `Dès ${(lowestPriceCents / 100).toLocaleString('fr-FR', { style: 'currency', currency })}`,
  }
}
