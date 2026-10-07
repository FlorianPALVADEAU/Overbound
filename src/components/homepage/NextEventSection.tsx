'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { Calendar, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFeaturedEvent } from '@/app/api/events/featured/featuredEventQueries'
import { getCurrentTicketPrice } from '@/lib/pricing'
import { isEventOpenForRegistration } from '@/lib/events/registrationStatus'
import { useParallax } from '@/hooks/useParallax'

export function NextEventSection() {
  const { data, isLoading } = useFeaturedEvent()
  const event = data?.event
  const sectionRef = useRef<HTMLElement>(null)
  const parallax = useParallax(sectionRef)

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
    <section ref={sectionRef} className="relative w-full overflow-hidden bg-neutral-950">
      <div className="absolute inset-0 -m-6">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="h-full w-full scale-110 object-cover will-change-transform"
            style={{ transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0) scale(1.1)` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-black/30" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 sm:py-20 xl:px-32">
        <span className="inline-flex w-fit items-center rounded-full bg-primary px-4 py-1.5 text-xs font-black uppercase tracking-[0.28em] text-white">
          Prochaine édition
        </span>

        <h2 className="text-balance wrap-break-word text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
          {event.title}
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
            <Calendar className="h-4 w-4" />
            {formattedDate}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
            <MapPin className="h-4 w-4" />
            {event.location}
          </span>
          {lowestPrice !== null ? (
            <span className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-white">
              Dès {(lowestPrice / 100).toLocaleString('fr-FR', { style: 'currency', currency })}
            </span>
          ) : null}
          {typeof data?.availableSpots === 'number' ? (
            <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              {data.availableSpots > 0 ? `${data.availableSpots} places disponibles` : 'Complet'}
            </span>
          ) : null}
        </div>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          {isOnSale ? (
            <Button asChild size="lg" className="h-12 w-full bg-red-600 hover:bg-red-700 sm:w-auto">
              <Link href={registerHref}>Je m&apos;inscris</Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="h-12 w-full sm:w-auto">
              <Link href={discoverHref}>Découvrir l&apos;événement</Link>
            </Button>
          )}
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 w-full border-white/40 bg-transparent text-white hover:bg-white/10 sm:w-auto"
          >
            <Link href="#concept">Comprendre en 40 s</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
