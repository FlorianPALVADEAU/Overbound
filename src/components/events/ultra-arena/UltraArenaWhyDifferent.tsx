'use client'

import Link from 'next/link'
import { Target, Heart, Flame, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const DIFFERENTIATORS = [
  {
    icon: Target,
    title: 'Tu choisis ta difficulté',
    body: "À chaque obstacle, tu peux adapter ton niveau d'engagement. Tu progresses à ton rythme, sans subir un format figé qui ne te correspond pas.",
    detail: 'Pas d\'élimination forcée en OPEN.',
  },
  {
    icon: Heart,
    title: 'Deux formats, un même terrain',
    body: "OPEN pour se dépasser à son rythme sans pression. RANKED pour la bataille et l'élimination progressive. Ton profil, ton choix.",
    detail: 'Même arène, deux ambiances différentes.',
  },
  {
    icon: Flame,
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
      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">
            Pourquoi c'est différent
          </p>
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
          {DIFFERENTIATORS.map(({ icon: Icon, title, body, detail }) => (
            <Card
              key={title}
              className="group relative overflow-hidden border-primary/15 bg-linear-to-br from-card/95 to-card/80 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <Icon className="h-6 w-6" />
                </div>
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
