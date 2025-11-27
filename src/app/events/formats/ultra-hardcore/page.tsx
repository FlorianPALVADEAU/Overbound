import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import WhichDistanceForMe from '@/components/WhichDistanceForMe'
import { FORMAT_LEVELS } from '@/constants/formatLevels'

const format = {
  name: FORMAT_LEVELS.hard.name,
  title: 'Format Ultra Hardcore',
  tagline: 'Engagement total',
  intro:
    'Pensé pour les acharnés. Obstacles premiums obligatoires, portés lourds répétés, contrôle matériel et coaching serré. Tu joues dans la cour des grands.',
  heroImage:
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0',
  accent: FORMAT_LEVELS.hard.accentClass,
  difficultyBadge: FORMAT_LEVELS.hard.badgeClass,
  effort: '7-10/10',
  differences: [
    'Variantes élites obligatoires, arbitrage strict.',
    'Pénalités 100 % physiques si échec, zéro contournement.',
    'Contrôle matériel et briefing spécifique avant le départ.',
    'Qualification ou ranking possible sur certains events.',
  ],
  highlights: [
    { title: 'Parcours', text: 'Dénivelé cumulé, sections en eau, portions nocturnes ou surprises logistiques pour tester ton mental.' },
    { title: 'Obstacles', text: 'Rigs combinés, portés lourds répétés, pénalités 100 % physiques si échec.' },
    { title: 'Contrôle', text: 'Check matériel, briefing spécifique, coaching dédié. Qualification possible sur certains events.' },
  ],
  experience: [
    'Reco guidée des obstacles premiums et des zones à risque.',
    'Plan de course recommandé : pacing négatif, nutrition et gestion du grip.',
    'Arbitrage strict sur les obstacles obligatoires, pénalités physiques si échec.',
    'Débrief post-course pour viser un podium ou un niveau élite partenaire.',
  ],
  checklist: [
    'Chaussures trail à crampons + gants robustes pour grip répété.',
    'Ceinture/flasque ou gilet léger pour hydratation et nutrition.',
    'Tenue qui sèche vite, frontale si portion nocturne indiquée.',
    'Arrive 90 min avant : check matériel + échauffement structuré.',
  ],
  idealFor: [
    'OCR confirmés, teams élites ou athlètes visant un podium.',
    'Objectif qualification ou préparation d’un format ultra.',
    'Envie de tester sa résilience physique et mentale en conditions réelles.',
  ],
}

const distances = [
  {
    name: 'Origin — 6 km',
    detail: `Sprint élite : obstacles obligatoires, pénalités physiques, zéro contournement. Vise le podium de vague en mode ${format.name}.`,
  },
  {
    name: 'Horizon — 12 km',
    detail: 'Gestion longue : rigs combinés, portés répétés, arbitrage strict. Nutrition et pacing obligatoires.',
  },
  {
    name: 'Ultra Arena — format backyard',
    detail: `Réservé aux acharnés : chaque boucle en mode ${format.name}. Si tu casses, pénalité physique ou élimination.`,
  },
]

export const metadata = {
  title: `${format.title} — OverBound`,
  description: format.intro,
}

export default function LegendePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      <section className="relative isolate overflow-hidden py-20 sm:py-24">
        <div className="absolute inset-0">
          <Image
            src={format.heroImage}
            alt="Athlètes OverBound - Format Ultra Hardcore"
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
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ce qui change vs {FORMAT_LEVELS.low.name}</p>
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
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ce qui change vs {FORMAT_LEVELS.mid.name}</p>
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
            Parcours inchangé, mais tout devient obligatoire. Variantes élites, pénalités 100 % physiques et contrôle matériel. À activer sur la distance qui correspond à ton volume.
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
                  Même parcours que {FORMAT_LEVELS.low.name} et {FORMAT_LEVELS.mid.name}, mais toutes les variantes élites sont obligatoires et contrôlées. Pénalités 100 % physiques si échec.
                </p>
                <p className="text-xs text-muted-foreground">
                  Astuce : planifie ta nutrition et ton grip. Gère les portés lourds dès la première boucle pour garder du jus jusqu’au bout.
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
