'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const EXPERIENCE_POINTS = [
  'Intensité physique et mentale au rendez-vous',
  'Cadre nature + village vivant et animé',
  'Challenge individuel ou collectif',
  'Format accessible même sans niveau élite',
]

const DEFAULT_IMAGES = [
  '/images/images/a-young-men-carrying-two-wooden-logs-on-his-shoulders-shouting-at-the-camera.avif',
  '/images/images/a-group-of-friends-celebrating-after-a-hard-obstacle.avif',
  '/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.avif',
  '/images/images/a-sunny-mood-with-runners-ready-to-go.avif',
]

interface Props {
  galleryImages?: string[]
  isOnSale: boolean
  registerHref: string
  onCtaClick?: () => void
}

export function UltraArenaProjection({ galleryImages = [], isOnSale, registerHref, onCtaClick }: Props) {
  const images =
    galleryImages.length > 0
      ? galleryImages.slice(0, 4)
      : DEFAULT_IMAGES

  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      {/* Atmospheric background */}
      <div className="absolute inset-0">
        <img
          src="/images/images/lot-of-runner-going-everywhere-with-chains-on-their-necks.avif"
          alt="Ambiance Ultra Arena"
          className="h-full w-full object-cover opacity-70"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-linear-to-b from-background/80 via-background/92 to-background" />
      </div>

      <div className="container relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
        {/* Left: Copy */}
        <div className="space-y-6">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">Projection</p>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Imagine ton jour de course.
          </h2>
          <p className="text-muted-foreground sm:text-base">
            Départ dans une ambiance électrique. Boucle après boucle, obstacle après obstacle, tu sens
            l'effort monter — puis la satisfaction quand tu passes un cap. Solo, entre amis ou en équipe,
            l'Ultra Arena s'adapte à ce que tu veux en vivre.
          </p>

          <blockquote className="border-l-2 border-primary pl-4 text-sm italic text-muted-foreground">
            "Tu repars épuisé, fier, et avec envie de revenir. C'est ça, l'Overbound."
          </blockquote>
          <p className="text-sm font-semibold text-primary">
            Le choix t&apos;appartient. C&apos;est là que ça se joue.
          </p>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {EXPERIENCE_POINTS.map((item) => (
              <div
                key={item}
                className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-card/80 p-3 text-sm"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {isOnSale ? (
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-xl px-8 text-base font-semibold sm:w-auto"
              onClick={onCtaClick}
            >
              <Link href={registerHref}>Je tente l&apos;expérience</Link>
            </Button>
          ) : (
            <Button asChild size="lg" variant="outline" className="h-12 w-full rounded-xl px-8 sm:w-auto" onClick={onCtaClick}>
              <a href="#formats">Voir les formats disponibles</a>
            </Button>
          )}
        </div>

        {/* Right: Gallery */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`Ultra Arena — moment de course ${i + 1}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="h-44 w-full rounded-2xl object-cover ring-1 ring-border/50 sm:h-56"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
