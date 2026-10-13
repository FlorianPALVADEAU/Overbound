'use client'

import Link from 'next/link'
import { Calendar, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFeaturedEvent } from '@/app/api/events/featured/featuredEventQueries'
import { getCurrentTicketPrice } from '@/lib/pricing'
import { isEventOpenForRegistration } from '@/lib/events/registrationStatus'
import { useParallax } from '@/hooks/useParallax'
import { Container, DISPLAY_TITLE, Eyebrow, Pill, Section } from '@/components/ds'
import { cn } from '@/lib/utils'

export function NextEventSection() {
  const { data, isLoading } = useFeaturedEvent()
  const event = data?.event
  const parallax = useParallax({ scale: 1.1 })

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
    <Section ref={parallax.containerRef} tone="deep">
      <div className="absolute inset-0 -z-10 -m-6 overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            ref={parallax.layerRef}
            className="h-full w-full scale-110 object-cover will-change-transform"
          />
        ) : null}
        <div className="absolute inset-0 bg-surface-deep/55" />
        <div className="absolute inset-0 bg-linear-to-t from-surface-deep via-surface-deep/60 to-surface-deep/30" />
      </div>

      <Container className="relative z-10 flex flex-col gap-6">
        <Eyebrow variant="pill">Prochaine édition</Eyebrow>

        <h2 className={cn(DISPLAY_TITLE, "text-display-lg")}>{event.title}</h2>

        <div className="flex flex-wrap items-center gap-3">
          <Pill variant="glass" className="py-2">
            <Calendar className="h-4 w-4" />
            {formattedDate}
          </Pill>
          <Pill variant="glass" className="py-2">
            <MapPin className="h-4 w-4" />
            {event.location}
          </Pill>
          {lowestPrice !== null ? (
            <Pill variant="tag" className="py-2 text-sm normal-case">
              Dès {(lowestPrice / 100).toLocaleString("fr-FR", { style: "currency", currency })}
            </Pill>
          ) : null}
          {typeof data?.availableSpots === "number" ? (
            <Pill variant="glass" className="py-2">
              {data.availableSpots > 0 ? `${data.availableSpots} places disponibles` : "Complet"}
            </Pill>
          ) : null}
        </div>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          {isOnSale ? (
            <Button asChild size="cta" className="w-full sm:w-auto">
              <Link href={registerHref}>Je m&apos;inscris</Link>
            </Button>
          ) : (
            <Button asChild size="cta" className="w-full sm:w-auto">
              <Link href={discoverHref}>Découvrir l&apos;événement</Link>
            </Button>
          )}
          <Button asChild variant="outline-on-photo" size="cta" className="w-full sm:w-auto">
            <Link href="#concept">Comprendre en 40 s</Link>
          </Button>
        </div>
      </Container>
    </Section>
  )
}
