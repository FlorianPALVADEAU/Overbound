'use client'

import { COVER } from '@/constants/coverImages'
import { Zap, Users, CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from '@/app/api/session/sessionQueries'
import {
  useGetBootcamps,
  useRegisterBootcamp,
  useUnregisterBootcamp,
} from '@/app/api/bootcamps/bootcampsQueries'
import { BootcampCard } from '@/components/bootcamps/BootcampCard'
import { BootcampCardSkeleton } from '@/components/bootcamps/BootcampCardSkeleton'
import AnimatedBanner from '@/components/homepage/AnimatedBanner'
import { PARTNERS_DATA } from '@/datas/Partners'
import Link from 'next/link'
import { filterUpcoming, filterPast } from '@/lib/bootcamps/bootcampFilters'
import { PageHero } from '@/components/hero/PageHero'
import { Container, Section, DISPLAY_TITLE, containerClass } from '@/components/ds'
import { cn } from '@/lib/utils'

/**
 * Bootcamp list. The page renders it on the server with the public list in
 * the React Query cache; the visitor's registrations arrive with the
 * refetch right after hydration.
 */
export function BootcampsView() {
  const { data: session } = useSession()
  const { data: bootcamps, isLoading, error } = useGetBootcamps()
  const { mutateAsync: register } = useRegisterBootcamp()
  const { mutateAsync: unregister } = useUnregisterBootcamp()

  const isAuthenticated = Boolean(session?.user)

  const upcoming = filterUpcoming(bootcamps ?? [])
  const past = filterPast(bootcamps ?? [])

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <PageHero
        image={{ src: COVER.pages.bootcamps, alt: 'Bootcamp Overbound', position: '50% 75%' }}
        eyebrow="Prépare-toi avec Overbound"
        title="Nos Bootcamps"
        description="Des sessions encadrées par l'équipe Overbound : foncier, technique, mental."
        actions={
          <Button asChild size="cta" className="w-full sm:w-auto">
            <Link href="#bootcamps">Voir les sessions</Link>
          </Button>
        }
      />

      {/* Bannière partenaires */}
      <section className="relative z-20 -mt-10 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="rounded-2xl border border-border/70 bg-background/85 p-3 shadow-xl backdrop-blur-md sm:p-4">
          <div className="mb-2 px-2 text-label font-semibold uppercase text-muted-foreground">
            Partenaires Officiels
          </div>
          <div className="overflow-hidden rounded-xl border border-border/60">
            <AnimatedBanner
              images={PARTNERS_DATA.map((partner) => partner.logo)}
              imageAltPrefix="Logo partenaire Overbound"
            />
          </div>
        </div>
      </section>

      {/* Liste bootcamps */}
      <Section id="bootcamps" tone="light" edge="mountain">
        <Container>
        {error ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
            <Zap className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Impossible de charger les bootcamps. Réessaie dans quelques minutes.
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Bootcamps à venir */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <CalendarCheck className="h-6 w-6 text-primary" />
                <h2 className="text-title font-display font-bold uppercase text-foreground">Sessions à venir</h2>
              </div>

              {isLoading ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <BootcampCardSkeleton key={`sk-${i}`} />
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border/60 bg-background/80 p-10 text-center shadow-inner">
                  <Users className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Aucun bootcamp prévu pour l'instant. Reviens bientôt !
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {upcoming.map((bootcamp) => (
                    <BootcampCard
                      key={bootcamp.id}
                      bootcamp={bootcamp}
                      isAuthenticated={isAuthenticated}
                      onRegister={register}
                      onUnregister={unregister}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bootcamps passés */}
            {!isLoading && past.length > 0 && (
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-muted-foreground">Sessions passées</h2>
                </div>
                <div className="flex flex-col gap-4 opacity-75">
                  {past.map((bootcamp) => (
                    <BootcampCard
                      key={bootcamp.id}
                      bootcamp={bootcamp}
                      isAuthenticated={isAuthenticated}
                      onRegister={register}
                      onUnregister={unregister}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </Container>
      </Section>

      {/* CTA bas de page */}
      <Section tone="deep" spacing="spacious" className="border-t border-primary/40">
        <Container className="flex flex-col gap-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4 text-center lg:text-left">
              <h2 className={cn(DISPLAY_TITLE, 'text-display-md')}>
                Prêt·e à relever le défi ?
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Entraîne-toi avec nous, puis inscris-toi à la course Overbound pour vivre l'expérience complète.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button asChild size="cta" className="w-full sm:w-auto">
                <Link href="/events/ultra-arena-2026">Voir les prochains événements</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="cta"
                className="w-full sm:w-auto"
              >
                <Link href="/contact">Contacter le support</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  )
}
