'use client'

import { COVER } from '@/constants/coverImages'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '../ui/button'
import { useFeaturedEvent } from '@/app/api/events/featured/featuredEventQueries'
import { getNextPriceChange } from '@/lib/pricing'
import { Container, DISPLAY_TITLE, Section } from '@/components/ds'
import { cn } from '@/lib/utils'

const CTA = () => {
  const { data } = useFeaturedEvent()
  const event = data?.event
  const availableSpots = data?.availableSpots

  const cheapestTicket = (event?.tickets ?? []).reduce(
    (min, t) => ((t.final_price_cents ?? Infinity) < (min?.final_price_cents ?? Infinity) ? t : min),
    (event?.tickets ?? [])[0],
  )
  const nextChange = cheapestTicket ? getNextPriceChange(cheapestTicket, event?.price_tiers ?? []) : null
  const nextChangeDate = nextChange
    ? nextChange.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : null

  const registerHref = event ? `/events/${event.slug}/register` : '/events/ultra-arena-2026/register'

  return (
    <Section spacing="none" tone="deep" className="flex min-h-screen flex-col items-center justify-center">
      <div className="absolute inset-0 -z-10">
        <Image
          src={COVER.home.cta}
          alt="Coureurs Overbound franchissant un obstacle avec des troncs d'arbres"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-40"
        />
        <div className="absolute inset-0 bg-surface-deep/60" />
      </div>

      <Container className="flex flex-col items-center gap-12 text-center lg:gap-16">
        <div className="flex flex-col items-center gap-4">
          <h2 className={cn(DISPLAY_TITLE, "text-display-lg text-primary")}>
            {typeof availableSpots === "number" && availableSpots > 0
              ? `${availableSpots} places disponibles`
              : "Inscriptions ouvertes"}
          </h2>
          <p className="max-w-3xl text-lead text-foreground/90">
            {nextChangeDate
              ? `Le tarif change le ${nextChangeDate}. Réserve ta place avant.`
              : "Rejoins la tribu Overbound et repousse tes limites."}
          </p>
        </div>
        <Button asChild size="hero" className="w-full sm:w-auto">
          <Link href={registerHref}>Je m&apos;inscris maintenant</Link>
        </Button>
      </Container>
    </Section>
  )
}

export default CTA
