'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HeroFrame } from '@/components/hero/HeroFrame'
import { LANDING_X } from './layout'

interface Props {
  title: string
  description?: string | null
  /** ISO date of the event, split into a big day and a short month. */
  eventDate: string
  location: string
  startingPriceLabel: string | null
  /** Real remaining spots, shown only while sales are open. */
  availableSpots: number | null
  statusLabel: string
  statusVariant: 'default' | 'destructive' | 'secondary' | 'outline'
  isOnSale: boolean
  formattedSalesStart: string | null
  registerHref: string
  /** Label of the primary action: register directly, or pick a format. */
  ctaLabel: string
  imageUrl?: string | null
  onRegisterClick: () => void
}

const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="min-w-0 px-4 py-4 sm:px-6 sm:py-5">
    <dt className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/55">{label}</dt>
    <dd className="mt-1.5 min-w-0">{children}</dd>
  </div>
)

/**
 * Event hero, mobile first. Poster-style: a huge title over the parallax photo,
 * and a bottom bar with the facts that decide a purchase (date, place, price,
 * spots left) next to the primary action.
 */
export function EventHero({
  title,
  description,
  eventDate,
  location,
  startingPriceLabel,
  availableSpots,
  statusLabel,
  statusVariant,
  isOnSale,
  formattedSalesStart,
  registerHref,
  ctaLabel,
  imageUrl,
  onRegisterClick,
}: Props) {
  const date = new Date(eventDate)
  const day = date.toLocaleDateString('fr-FR', { day: 'numeric' })
  const monthYear = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })

  return (
    <HeroFrame
      variant="tall"
      className="justify-end"
      image={{ url: imageUrl, src: '/images/images/a-smiling-running-man-black-weared-sport.avif', position: '50% 20%' }}
    >
      <div className={`${LANDING_X} pb-8 pt-32 sm:pb-12`}>
        <Badge variant={statusVariant} className="border border-primary/40 bg-black/40 text-primary backdrop-blur">
          {statusLabel}
        </Badge>

        <h1 className="mt-5 text-balance wrap-break-word text-[clamp(2.75rem,11vw,8.5rem)] font-black uppercase leading-[0.88] tracking-tighter">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 line-clamp-2 max-w-xl text-base text-white/75 sm:text-lg">{description}</p>
        ) : null}
      </div>

      <div className="border-t border-white/10 bg-background">
        <div className={`${LANDING_X} grid items-stretch lg:grid-cols-[1fr_auto]`}>
          <dl className="grid grid-cols-2 divide-white/15 max-lg:divide-y lg:grid-cols-4 lg:divide-x [&>div:nth-child(even)]:border-l [&>div:nth-child(even)]:border-white/15 lg:[&>div:nth-child(even)]:border-l-0">
            <Fact label="Date">
              <span className="text-3xl font-black leading-none sm:text-4xl">{day}</span>{' '}
              <span className="text-sm font-bold uppercase">{monthYear}</span>
            </Fact>
            <Fact label="Lieu">
              <span className="line-clamp-2 text-sm font-bold leading-snug sm:text-base">{location}</span>
            </Fact>
            {startingPriceLabel ? (
              <Fact label="Tarif">
                <span className="text-2xl font-black leading-none text-primary sm:text-3xl">{startingPriceLabel}</span>
              </Fact>
            ) : null}
            {isOnSale && availableSpots !== null && availableSpots > 0 ? (
              <Fact label="Disponibilité">
                <span className="text-3xl font-black leading-none sm:text-4xl">{availableSpots}</span>{' '}
                <span className="text-sm font-bold uppercase">places</span>
              </Fact>
            ) : null}
          </dl>

          <div className="flex flex-col justify-center gap-2 border-white/15 px-4 py-4 sm:px-6 lg:border-l lg:pl-8 lg:pr-0">
            {isOnSale ? (
              <Button asChild size="lg" className="h-14 w-full rounded-xl px-10 text-base font-black lg:w-auto" onClick={onRegisterClick}>
                <Link href={registerHref}>{ctaLabel}</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="h-14 w-full rounded-xl px-10 text-base font-black lg:w-auto">
                <a href="#departs">Voir les formats et les prix</a>
              </Button>
            )}
            {!isOnSale && formattedSalesStart ? (
              <p className="text-xs text-white/60">Ouverture des inscriptions le {formattedSalesStart}.</p>
            ) : null}
          </div>
        </div>
      </div>
    </HeroFrame>
  )
}
