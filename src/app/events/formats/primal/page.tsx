import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import WhichDistanceForMe from '@/components/WhichDistanceForMe'
import { FORMAT_LEVELS } from '@/constants/formatLevels'

const format = {
  name: FORMAT_LEVELS.low.name,
  title: 'Format Primal',
  tagline: 'Découverte engagée',
  intro:
    'Version accessible pour goûter au flow OverBound sans pression. Obstacles iconiques avec options de contournement, coaching terrain rapproché et ambiance tribu pour te mettre en confiance.',
  heroImage:
    'https://images.unsplash.com/photo-1529360575654-6aa98c9bbb88?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0',
  accent: FORMAT_LEVELS.low.accentClass,
  difficultyBadge: FORMAT_LEVELS.low.badgeClass,
  effort: '1-3/10',
  differences: [
    'Variantes d’obstacles accessibles avec contournements validés.',
    'Pénalités souples pour favoriser le flow et la confiance.',
    'Coaching rapproché et brief rassurant avant les obstacles clés.',
    'Ambiance tribu : on t’encourage, pas de pression chrono obligatoire.',
  ],
  highlights: [
    { title: 'Parcours', text: 'Sentiers, boue et quelques zones techniques pour apprendre à gérer ton énergie sans te cramer.' },
    { title: 'Obstacles', text: 'Murs, cordes, monkey bar avec options safe. On t’aide à trouver la bonne variante.' },
    { title: 'Coaching', text: 'Briefing rassurant, volontaires proches de toi et encouragements tribu à chaque obstacle.' },
  ],
  experience: [
    'Échauffement guidé + explication des obstacles clés avant le départ.',
    'Pacing conseillé pour alterner course et obstacles sans rupture.',
    'Chaque obstacle propose une option de contournement validée par le staff.',
    'Tu finis avec le sourire : photo finish + médaille pour acter ton premier rite.',
  ],
  checklist: [
    'Chaussures trail propres pour la boue.',
    'Gants légers si tu veux sécuriser le grip.',
    'Hydratation légère, pas besoin de sac pour ce format.',
    'Arrive 60 min avant pour le briefing et l’échauffement collectif.',
  ],
  idealFor: [
    'Première OCR ou reprise après une pause.',
    'Groupes d’amis ou teams corporate qui veulent partager un souvenir commun.',
    `Objectif confiance avant de passer en ${FORMAT_LEVELS.mid.name}.`,
  ],
}

const distances = [
  {
    name: 'Origin — 6 km',
    detail: `Obstacles accessibles, options de contournement validées par le staff. Idéal première immersion en mode ${format.name}.`,
  },
  {
    name: 'Horizon — 12 km',
    detail: `Même parcours que les niveaux supérieurs mais variantes ${format.name}. On t’aide à gérer l’effort sur la longueur.`,
  },
  {
    name: 'Ultra Arena — format backyard',
    detail: `Possible en vague découverte : première boucle en mode ${format.name} pour sentir le concept, sans pression éliminatoire.`,
  },
]

export const metadata = {
  title: `${format.title} — OverBound`,
  description: format.intro,
}

export default function StandardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      <section className="relative isolate overflow-hidden py-20 sm:py-24">
        <div className="absolute inset-0">
          <Image
            src={format.heroImage}
            alt="Athlètes OverBound - Format Primal"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-background/30 backdrop-blur-[2px]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/15 via-background/70 to-background" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
          <Link href="/events/formats" className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">
            ← Formats OverBound
          </Link>
          <div className="max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              {format.name}
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">{format.title}</h1>
            <p className="text-base font-semibold text-primary">{format.tagline}</p>
            <p className="text-lg text-muted-foreground">{format.intro}</p>
            <div className="flex flex-wrap gap-3">
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${format.difficultyBadge}`}>
                Difficulté {format.effort}
              </span>
              <Badge variant="outline" className="border-primary/50 text-primary">
                Applicables à toutes les distances
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-border/60 bg-background/80">
                <CardContent className="space-y-2 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ce qui change vs {FORMAT_LEVELS.mid.name}</p>
                  <ul className="space-y-2 text-sm text-foreground/90">
                    {format.differences.slice(0, 2).map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-background/80">
                <CardContent className="space-y-2 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ce qui change vs {FORMAT_LEVELS.hard.name}</p>
                  <ul className="space-y-2 text-sm text-foreground/90">
                    {format.differences.slice(2).map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Distance d&apos;abord, difficulté ensuite</p>
          <h2 className="text-3xl font-semibold">Comment le mode {format.name} s&apos;applique sur chaque distance.</h2>
          <p className="text-sm text-muted-foreground">
            Le parcours reste le même. C&apos;est la variante d&apos;obstacle et la pénalité qui changent. Choisis ta distance, active le mode {format.name} et profite d&apos;un flow rassurant.
          </p>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {distances.map((distance) => (
            <Card key={distance.name} className="border-border/60 bg-background/85 shadow-lg shadow-primary/5">
              <CardContent className="space-y-2 p-5">
                <p className="text-sm font-semibold text-foreground">{distance.name}</p>
                <p className="text-sm text-muted-foreground">{distance.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto w-screen max-w-6xl px-4 pb-16 sm:px-6 lg:px-8 lg:pt-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {format.highlights.map((highlight) => (
            <Card
              key={highlight.title}
              className="relative overflow-hidden border-0 bg-background/85 shadow-lg shadow-primary/10 backdrop-blur"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${format.accent} opacity-70`} />
              <CardContent className="relative space-y-2 p-6">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{highlight.title}</p>
                <p className="text-sm text-foreground/90">{highlight.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <Card className="border-none bg-background/90 shadow-xl shadow-primary/10 backdrop-blur">
          <CardContent className="grid gap-10 p-6 sm:p-8 lg:grid-cols-[1.3fr,1fr] lg:items-start">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Ce que tu vas vivre sur ce niveau</h2>
              <ul className="space-y-3 text-sm text-foreground/90">
                {format.experience.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4 rounded-3xl border border-border/60 bg-muted/10 p-6">
              <h3 className="text-lg font-semibold">Check-list express</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {format.checklist.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <Link
                  href="/events"
                  className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/80"
                >
                  Voir les courses compatibles
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <Card className="border-none bg-background/90 shadow-lg shadow-primary/10 backdrop-blur">
          <CardContent className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr,1fr] lg:items-center">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">Pour qui c&apos;est parfait</h3>
              <ul className="space-y-3 text-sm text-foreground/90">
                {format.idealFor.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/trainings/what-race-for-me">Trouver ma distance</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full border-primary text-primary hover:bg-primary/10"
                >
                  <Link href="/events">Voir les dates</Link>
                </Button>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-lg">
              <div className="space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">Ligne directrice</p>
                <p className="text-sm text-foreground/90">
                  Même parcours que les niveaux supérieurs, mais variantes d’obstacles plus accessibles et pénalités souples. Objectif : confiance + plaisir.
                </p>
                <p className="text-xs text-muted-foreground">
                  Astuce : tente une vague {format.name} chrono pour te challenger en douceur avant de passer en {FORMAT_LEVELS.mid.name}.
                </p>
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="relative z-10">
        <WhichDistanceForMe />
      </section>
    </main>
  )
}
