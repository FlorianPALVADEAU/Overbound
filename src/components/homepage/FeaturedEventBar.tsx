'use client'

import Link from 'next/link'
import { Calendar, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFeaturedEvent } from '@/app/api/events/featured/featuredEventQueries'
import { getCurrentTicketPrice } from '@/lib/pricing'
import { isEventOpenForRegistration } from '@/lib/events/registrationStatus'

export function FeaturedEventBar() {
  const { data, isLoading } = useFeaturedEvent()
  const event = data?.event

  if (isLoading || !event) return null

  const tickets = event.tickets ?? []
  const priceTiers = event.price_tiers ?? []
  const ticketPrices = tickets
    .map((t) => getCurrentTicketPrice(t, priceTiers))
    .filter((p): p is number => typeof p === 'number')
  const lowestPrice = ticketPrices.length > 0 ? Math.min(...ticketPrices) : null
  const currency = (tickets.find((t) => t.currency)?.currency ?? 'EUR').toUpperCase()

  const formattedDate = new Date(event.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const isOnSale = isEventOpenForRegistration(event) && (data?.availableSpots ?? 0) > 0
  const registerHref = `/events/${event.slug}/register`
  const discoverHref = `/events/${event.slug}`

  return (
    <div className="w-full border-y border-border/60 bg-card/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 xl:px-32">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="font-bold">{event.title}</span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {formattedDate}
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {event.location}
          </span>
          {lowestPrice !== null ? (
            <span className="font-semibold text-primary">
              Dès {(lowestPrice / 100).toLocaleString('fr-FR', { style: 'currency', currency })}
            </span>
          ) : null}
          {typeof data?.availableSpots === 'number' ? (
            <span className="text-muted-foreground">
              {data.availableSpots > 0 ? `${data.availableSpots} places disponibles` : 'Complet'}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="min-h-11 rounded-full">
            <Link href="#concept">Comprendre en 40 s</Link>
          </Button>
          {isOnSale ? (
            <Button asChild size="sm" className="min-h-11 rounded-full">
              <Link href={registerHref}>Je m'inscris</Link>
            </Button>
          ) : (
            <Button asChild variant="secondary" size="sm" className="min-h-11 rounded-full">
              <Link href={discoverHref}>Découvrir l'événement</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
