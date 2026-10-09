'use client'

import Link from 'next/link'
import { PageHero } from '@/components/hero/PageHero'
import { Button } from '@/components/ui/button'
import { LandingBand } from '@/components/events/landing/LandingBand'
import { SectionEyebrow } from '@/components/events/landing/SectionEyebrow'
import { LANDING_X } from '@/components/events/landing/layout'
import { FormatsCompare } from '@/components/events/formats/FormatsCompare'
import { FormatsJourney } from '@/components/events/formats/FormatsJourney'
import { FormatsPicker } from '@/components/events/formats/FormatsPicker'
import { FormatsPractical } from '@/components/events/formats/FormatsPractical'
import { FormatsFaq } from '@/components/events/formats/FormatsFaq'
import { FormatsStickyCta } from '@/components/events/formats/FormatsStickyCta'
import {
  OPEN_JOURNEY,
  RANKED_JOURNEY,
} from '@/components/events/formats/content'
import { SHARED_FORMAT_RULES } from '@/constants/raceFormatRules'
import { useFeaturedEvent } from '@/app/api/events/featured/featuredEventQueries'
import { isEventOpenForRegistration } from '@/lib/events/registrationStatus'
import { formatPrice, getCurrentTicketPrice } from '@/lib/pricing'

const BG = {
  hero: '/images/images/lot-of-runner-going-everywhere-with-chains-on-their-necks.avif',
  journey: '/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.avif',
}

const HERO_FACTS = [
  `${SHARED_FORMAT_RULES.loopKm} km par tour`,
  '10+ obstacles',
  `${SHARED_FORMAT_RULES.minAge} ans et +`,
]

export default function FormatsPage() {
  const { data, isLoading } = useFeaturedEvent()
  const event = data?.event
  const tickets = event?.tickets ?? []
  const fromPrice = (() => {
    const prices = tickets.map((t) => getCurrentTicketPrice(t, event?.price_tiers ?? []))
    return prices.length ? formatPrice(Math.min(...prices)) : null
  })()
  const eventHref = event ? `/events/${event.slug}` : null
  const isOnSale = !!event && isEventOpenForRegistration(event) && (data?.availableSpots ?? 0) > 0
  const ctaLabel = isOnSale
    ? `Je m'inscris${fromPrice ? ` · dès ${fromPrice}` : ''}`
    : "Voir l'événement"

  return (
    <main className="min-h-screen bg-background pb-20 text-foreground md:pb-0">
      <PageHero
        image={{ src: BG.hero }}
        eyebrow="Deux façons de courir"
        title="OPEN ou RANKED : même parcours, deux façons de courir"
        description={
          <>
            <p>OPEN : ton rythme, jusqu&apos;à 7 h, sans pénalité. RANKED : départ à 8h00, le dernier debout gagne.</p>
            <ul className="flex flex-wrap justify-center gap-2 lg:justify-start">
              {HERO_FACTS.map((fact) => (
                <li
                  key={fact}
                  className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary"
                >
                  {fact}
                </li>
              ))}
            </ul>
          </>
        }
        actions={
          eventHref ? (
            <Button asChild size="lg" className="min-h-12 w-full px-8 text-base font-black sm:w-auto">
              <Link href={eventHref}>{ctaLabel}</Link>
            </Button>
          ) : !isLoading ? (
            <p className="text-sm text-muted-foreground">Prochaine édition bientôt annoncée.</p>
          ) : null
        }
      />

      <LandingBand variant="light" angled className="z-10">
        <div className={`${LANDING_X} py-6 sm:py-8`}>
          <SectionEyebrow>En un coup d&apos;œil</SectionEyebrow>
          <h2 className="mb-6 mt-2 text-3xl font-black tracking-tight">Comparer les formats</h2>
          <FormatsCompare />
        </div>
      </LandingBand>

      <LandingBand backgroundSrc={BG.journey} className="-mt-6 pt-6 sm:-mt-10 sm:pt-10">
        <div className={`${LANDING_X} py-12 sm:py-16`}>
          <SectionEyebrow>Le déroulé</SectionEyebrow>
          <h2 className="mb-8 mt-2 text-3xl font-black tracking-tight">Comment se passe ta journée</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <FormatsJourney title="OPEN" tone="open" steps={OPEN_JOURNEY} />
            <FormatsJourney title="RANKED" tone="ranked" steps={RANKED_JOURNEY} />
          </div>
        </div>
      </LandingBand>

      <LandingBand variant="light">
        <div className={`${LANDING_X} max-w-3xl py-12 sm:py-16`}>
          <SectionEyebrow>Pas sûr ?</SectionEyebrow>
          <h2 className="mb-8 mt-2 text-3xl font-black tracking-tight">Trouve ton format en 3 questions</h2>
          <FormatsPicker eventHref={eventHref} />
        </div>
      </LandingBand>

      <LandingBand>
        <div className={`${LANDING_X} max-w-4xl py-12 sm:py-16`}>
          <SectionEyebrow>Infos pratiques</SectionEyebrow>
          <h2 className="mb-6 mt-2 text-3xl font-black tracking-tight">Valable pour les deux formats</h2>
          <FormatsPractical />
        </div>
      </LandingBand>

      <LandingBand className="border-t border-border/60 bg-[#141414]">
        <div className={`${LANDING_X} py-12 sm:py-16`}>
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2 className="mb-6 mt-2 text-3xl font-black tracking-tight">Questions fréquentes</h2>
          <FormatsFaq />
        </div>
      </LandingBand>

      {eventHref ? (
        <>
          <LandingBand className="border-t border-primary/40 bg-black">
            <div className={`${LANDING_X} py-12 text-center sm:py-16`}>
              <h2 className="text-balance text-3xl font-black tracking-tight sm:text-4xl">
                Ton format est choisi. Prends ta place.
              </h2>
              <Button asChild size="lg" className="mt-6 min-h-12 w-full px-8 text-base font-black sm:w-auto">
                <Link href={eventHref}>{ctaLabel}</Link>
              </Button>
            </div>
          </LandingBand>
          <FormatsStickyCta href={eventHref} label={ctaLabel} />
        </>
      ) : null}
    </main>
  )
}
