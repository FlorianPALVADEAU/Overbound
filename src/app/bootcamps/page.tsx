'use client'

import Image from 'next/image'
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

export default function BootcampsPage() {
  const { data: session } = useSession()
  const { data: bootcamps, isLoading, error } = useGetBootcamps()
  const { mutateAsync: register } = useRegisterBootcamp()
  const { mutateAsync: unregister } = useUnregisterBootcamp()

  const isAuthenticated = Boolean(session?.user)

  const upcoming = filterUpcoming(bootcamps ?? [])
  const past = filterPast(bootcamps ?? [])

  return (
    <main className="relative min-h-screen bg-white text-foreground">
      {/* Hero */}
      <section className="relative isolate overflow-hidden py-20 sm:py-24">
        <div className="absolute inset-0">
          <Image
            src="/images/images/young-man-lifting-a-tractor-tire-with-a-photograph-in-his-back.avif"
            alt="Bootcamp Overbound"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-background/15 backdrop-blur-[3px]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/15 via-background/70 to-background" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm">
              Prépare-toi avec Overbound
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Nos Bootcamps
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Des sessions d'entraînement encadrées par l'équipe Overbound pour te préparer au mieux à la course.
              Foncier, technique, mental — on t'emmène jusqu'au départ dans les meilleures conditions.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="h-12 w-full sm:w-auto">
                <Link href="#bootcamps">Voir les sessions</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Bannière partenaires */}
      <section className="relative z-20 -mt-10 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="mx-auto w-full max-w-7xl rounded-2xl border border-border/70 bg-background/85 p-3 shadow-xl backdrop-blur-md sm:p-4">
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
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

      {/* Séparateur montagne */}
      <section className="h-auto relative w-full bg-white">
        <Image
          src="/images/decorations/mountain-vector.svg"
          alt="Illustration montagne"
          width={1200}
          height={600}
          className="pointer-events-none z-1 relative -top-1 left-0 rotate-180 w-full"
          priority
        />
      </section>

      {/* Liste bootcamps */}
      <section
        id="bootcamps"
        className="relative z-10 mx-auto w-full max-w-7xl py-16 px-4 sm:px-6 lg:px-8 bg-white"
      >
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
                <h2 className="text-2xl font-bold text-black">Sessions à venir</h2>
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
                  <h2 className="text-xl font-semibold text-muted-foreground">Sessions passées</h2>
                </div>
                <div className="flex flex-col gap-4 opacity-60">
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
      </section>

      {/* Séparateur montagne bas */}
      <section className="h-auto relative w-full bg-white">
        <Image
          src="/images/decorations/mountain-vector.svg"
          alt="Illustration montagne"
          width={1200}
          height={600}
          className="pointer-events-none z-1 relative -bottom-1 left-0 w-full"
          priority
        />
      </section>

      {/* CTA bas de page */}
      <section className="relative z-10 bg-background py-16 sm:py-20">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4 text-center lg:text-left">
              <h2 className="text-2xl font-semibold sm:text-3xl md:text-4xl">
                Prêt·e à relever le défi ?
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Entraîne-toi avec nous, puis inscris-toi à la course Overbound pour vivre l'expérience complète.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button asChild size="lg" className="h-12 w-full sm:w-auto">
                <Link href="/events">Voir les prochains événements</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 w-full border-primary text-primary hover:bg-primary/10 sm:w-auto"
              >
                <Link href="/contact">Contacter le support</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
