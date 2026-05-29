'use client'

import Link from 'next/link'
import { ArrowLeft, Mountain, Target, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AnimatedBanner from '@/components/homepage/AnimatedBanner'
import { PARTNERS_DATA } from '@/datas/Partners'

interface Props {
  formattedDate: string
  location: string
  statusLabel: string
  statusVariant: 'default' | 'destructive' | 'secondary' | 'outline'
  isOnSale: boolean
  isAnnounced: boolean
  formattedSalesStart: string | null
  registerHref: string
  onDiscoverClick: () => void
  onRegisterClick: () => void
}

export function UltraArenaHero({
  formattedDate,
  location,
  statusLabel,
  statusVariant,
  isOnSale,
  isAnnounced,
  formattedSalesStart,
  registerHref,
  onDiscoverClick,
  onRegisterClick,
}: Props) {
  return (
    <section className="relative isolate overflow-hidden py-20 sm:py-24 lg:py-28">
      {/* Background images */}
      <div className="absolute inset-0">
        <img
          src="/images/images/a-young-men-carrying-two-wooden-logs-on-his-shoulders-shouting-at-the-camera.avif"
          alt="Ultra Arena — intensité Overbound"
          className="hidden h-full w-full object-cover object-center opacity-35 lg:block"
          fetchPriority="high"
        />
        <img
          src="/images/images/a-smiling-running-man-black-weared-sport.avif"
          alt="Ultra Arena — runner Overbound"
          className="h-full w-full object-cover object-[50%_8%] opacity-25 lg:hidden"
          fetchPriority="high"
        />  
        <div className="absolute inset-0 bg-linear-to-b from-background/20 via-background/82 to-background" />
      </div>

      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Nav row */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/events">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full border border-border/60 bg-background/75 px-5 text-muted-foreground backdrop-blur hover:bg-background/90 hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <Badge
            variant={statusVariant}
            className="border border-primary/30 bg-primary/10 text-primary"
          >
            {statusLabel}
          </Badge>
        </div>

        <div className="grid min-w-0 items-start gap-10 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Left: Headline + facts */}
          <div className="min-w-0 space-y-7">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
              Ultra Arena 2026
            </p>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              La course à obstacles où tu choisis quand tu t'arrêtes.
            </h1>

            <p className="text-base font-semibold text-primary sm:text-lg">
              Chaque obstacle te force à choisir.
            </p>

            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              Format Backyard à obstacles. Une boucle, des obstacles, autant de tours que tu peux.
              Deux formats, une arène, une ambiance hors norme. Tu viens pour te tester — et tu repars transformé.
            </p>

            {/* Quick facts strip */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3 backdrop-blur sm:rounded-2xl sm:p-4">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[10px]">
                  Date
                </p>
                <p className="mt-1 text-xs font-bold leading-tight sm:text-sm">{formattedDate}</p>
              </div>
              <div className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3 backdrop-blur sm:rounded-2xl sm:p-4">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[10px]">
                  Lieu
                </p>
                <p className="mt-1 wrap-break-word text-xs font-bold leading-tight sm:text-sm">{location}</p>
              </div>
              <div className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3 backdrop-blur sm:rounded-2xl sm:p-4">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[10px]">
                  Formats
                </p>
                <p className="mt-1 text-xs font-bold sm:text-sm">OPEN + RANKED</p>
              </div>
            </div>

            {isAnnounced && formattedSalesStart && (
              <p className="text-xs text-muted-foreground">
                Ouverture des inscriptions prévue le {formattedSalesStart}.
              </p>
            )}

            {isOnSale ? (
              <div className="max-w-2xl overflow-hidden rounded-lg border border-border/25 bg-background/30 p-2">
                <AnimatedBanner
                  images={PARTNERS_DATA.map((partner) => partner.logo)}
                  imageAltPrefix="Logo partenaire Overbound"
                  compact
                  subtle
                />
              </div>
            ) : null}
          </div>

          {/* Right: Experience preview card + CTA */}
          <div className="min-w-0 space-y-3">
            <Card className="border-primary/15 bg-card/85 shadow-2xl shadow-black/15 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Ce que tu vas vivre</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 text-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Mountain className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Une boucle de ~2 km</p>
                    <p className="mt-0.5 text-muted-foreground">
                      Obstacles physiques et mentaux. Répète tant que tu veux — ou tant que tu peux.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Tu pilotes ton engagement</p>
                    <p className="mt-0.5 text-muted-foreground">
                      À chaque obstacle, tu ajustes. Pas de format imposé qui te dépasse ou te sous-estime.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Ambiance village + encadrement terrain</p>
                    <p className="mt-0.5 text-muted-foreground">
                      Solo ou en groupe, l'événement est pensé pour vivre un vrai moment ensemble.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-2xl border border-border/60 bg-card/80 p-4 backdrop-blur">
              <div className="flex flex-col items-stretch gap-2.5">
              {isOnSale ? (
                <Button
                  asChild
                  size="lg"
                  className="h-14 w-full rounded-2xl px-8 text-base font-bold"
                  onClick={onRegisterClick}
                >
                  <Link href={registerHref}>Je m&apos;inscris maintenant</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="h-14 w-full rounded-2xl px-8 text-base font-bold"
                >
                  <a href="#formats">Voir les formats</a>
                </Button>
              )}

              <Button
                asChild
                variant="ghost"
                className="h-11 w-full rounded-xl border border-border/60 bg-background/45 px-4 text-sm font-semibold text-foreground/90 hover:bg-background/70"
                onClick={onDiscoverClick}
              >
                <a href="#pourquoi-different">Voir si c&apos;est pour moi</a>
              </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
