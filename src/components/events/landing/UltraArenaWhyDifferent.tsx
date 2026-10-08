'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SectionEyebrow } from './SectionEyebrow'
import { LANDING_X } from './layout'

const DIFFERENTIATORS = [
  {
    title: 'Tu choisis ta difficulté',
    body: "À chaque obstacle, tu peux adapter ton niveau d'engagement. Tu progresses à ton rythme, sans subir un format figé qui ne te correspond pas.",
    detail: 'Pas d\'élimination forcée en OPEN.',
  },
  {
    title: 'Deux formats, un même terrain',
    body: "OPEN pour se dépasser à son rythme sans pression. RANKED pour la bataille et l'élimination progressive. Ton profil, ton choix.",
    detail: 'Même arène, deux ambiances différentes.',
  },
  {
    title: 'Intense du premier au dernier mètre',
    body: 'Obstacles, rythme, ambiance village et mental : tout est pensé pour que tu vives un vrai moment de dépassement — pas juste une course.',
    detail: "L'effort porte un sens. Pas juste de la douleur.",
  },
]

interface Props {
  isOnSale: boolean
  registerHref: string
  onCtaClick?: () => void
}

export function UltraArenaWhyDifferent({ isOnSale, registerHref, onCtaClick }: Props) {
  return (
    <section id="pourquoi-different" className="relative isolate overflow-hidden py-16 sm:py-20">
      <div className={`${LANDING_X} relative z-10`}>
        <div className="mb-10 max-w-2xl">
          <SectionEyebrow>Pourquoi c&apos;est différent</SectionEyebrow>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Pas une course standard.
            <br className="hidden sm:block" /> Une expérience à piloter.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Overbound repense le format course à obstacles pour que chaque profil y trouve son compte —
            sans jamais simplifier l'expérience.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {DIFFERENTIATORS.map(({ title, body, detail }, index) => (
            <Card
              key={title}
              className="group relative overflow-hidden border-primary/15 bg-linear-to-br from-card/95 to-card/80 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
            >
              <CardContent className="p-6">
                <p
                  aria-hidden
                  className="mb-4 text-5xl font-black leading-none text-primary/35"
                >
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <ArrowRight className="h-3 w-3 shrink-0" />
                  {detail}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Inline CTA after the 3 cards */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="h-12 rounded-xl px-8 text-base font-semibold">
            <a href="#formats" onClick={onCtaClick}>Voir les deux formats</a>
          </Button>
          {isOnSale && (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-xl border-primary/40 px-8 text-base font-semibold"
              onClick={onCtaClick}
            >
              <Link href={registerHref}>Je prends ma place</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
