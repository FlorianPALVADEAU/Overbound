'use client'

import Link from 'next/link'
import { PageHero } from '@/components/hero/PageHero'
import { Button } from '@/components/ui/button'
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
import { Container, Section, SectionHeader, DISPLAY_TITLE } from '@/components/ds'
import { cn } from '@/lib/utils'

const BG = {
  hero: '/images/images/lot-of-runner-going-everywhere-with-chains-on-their-necks.webp',
  journey: '/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.webp',
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
                  className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-label font-semibold uppercase text-primary"
                >
                  {fact}
                </li>
              ))}
            </ul>
          </>
        }
        actions={
          eventHref ? (
            <Button asChild size="hero" className="w-full sm:w-auto">
              <Link href={eventHref}>{ctaLabel}</Link>
            </Button>
          ) : !isLoading ? (
            <p className="text-sm text-muted-foreground">Prochaine édition bientôt annoncée.</p>
          ) : null
        }
      />

      <Section tone="light" edge="angled" className="z-10">
        <Container>
          <SectionHeader eyebrow={<>En un coup d&apos;œil</>} title="Comparer les formats" />
          <FormatsCompare />
        </Container>
      </Section>

      {/* Slides under the angled band above: extra top padding = the overlap */}
      <Section backgroundSrc={BG.journey} className="-mt-6 pt-22 sm:-mt-10 sm:pt-30 lg:pt-34">
        <Container>
          <SectionHeader eyebrow="Le déroulé" title="Comment se passe ta journée" />
          <div className="grid gap-6 lg:grid-cols-2">
            <FormatsJourney title="OPEN" tone="open" steps={OPEN_JOURNEY} />
            <FormatsJourney title="RANKED" tone="ranked" steps={RANKED_JOURNEY} />
          </div>
        </Container>
      </Section>

      <Section tone="light">
        <Container size="prose">
          <SectionHeader eyebrow="Pas sûr ?" title="Trouve ton format en 3 questions" />
          <FormatsPicker eventHref={eventHref} />
        </Container>
      </Section>

      <Section>
        <Container size="prose">
          <SectionHeader eyebrow="Infos pratiques" title="Valable pour les deux formats" />
          <FormatsPractical />
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <SectionHeader eyebrow="FAQ" title="Questions fréquentes" />
          <FormatsFaq />
        </Container>
      </Section>

      {eventHref ? (
        <>
          <Section tone="deep" spacing="spacious" className="border-t border-primary/40">
            <Container className="flex flex-col items-center gap-6 text-center">
              <h2 className={cn(DISPLAY_TITLE, 'max-w-3xl text-display-lg')}>Ton format est choisi. Prends ta place.</h2>
              <Button asChild size="hero" className="w-full sm:w-auto">
                <Link href={eventHref}>{ctaLabel}</Link>
              </Button>
            </Container>
          </Section>
          <FormatsStickyCta href={eventHref} label={ctaLabel} />
        </>
      ) : null}
    </main>
  )
}
