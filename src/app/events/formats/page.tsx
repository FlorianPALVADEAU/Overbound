import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Mountain, Sparkles, Crown, Users } from 'lucide-react'
import WhichDistanceForMe from '@/components/WhichDistanceForMe'
import { FORMAT_LEVELS } from '@/constants/formatLevels'

const distanceFormats = [
  {
    name: 'Origin',
    distance: '6 km · 20 obstacles',
    badge: { label: 'Sprint', className: 'bg-green-500/20 text-green-700' },
    description: 'Format explosif pour découvrir l’OCR ou revenir en force. Flow court, impact maximum.',
    href: '/events',
  },
  {
    name: 'Horizon',
    distance: '12 km · 35 obstacles',
    badge: { label: 'Intermédiaire', className: 'bg-blue-500/20 text-blue-700' },
    description: 'Endurance + technique. Pour monter en puissance et travailler la gestion de course.',
    href: '/events',
  },
  {
    name: 'Ultra Arena',
    distance: '∞ km · ∞ obstacles',
    badge: { label: 'Élite', className: 'bg-amber-500 text-white' },
    description: 'Backyard OCR inédite. Élimination progressive, jusqu’au dernier debout.',
    href: '/events',
  },
  {
    name: 'Tribal Kids',
    distance: '1 / 2 / 3 km',
    badge: { label: 'Famille', className: 'bg-purple-500/20 text-purple-700' },
    description: 'Parcours ludiques et sécurisés pour les 6-14 ans. Initiation à l’esprit OverBound.',
    href: '/events',
  },
]

const difficulties = [
  {
    name: FORMAT_LEVELS.low.name,
    tagline: 'Découverte engagée',
    description:
      'Option safe avec contournements possibles. Coaching rapproché pour garder le sourire sans sacrifier les sensations.',
    stats: [
      { label: 'Obstacles', value: 'Adaptables' },
      { label: 'Pénalités', value: 'Souples' },
    ],
    highlights: ['Briefing rassurant', 'Ambiance tribu', 'Idéal premières OCR / teams'],
    difficultyClass: FORMAT_LEVELS.low.badgeClass,
    gradient: FORMAT_LEVELS.low.accentClass,
    border: 'border-green-500/20',
    href: FORMAT_LEVELS.low.path,
  },
  {
    name: FORMAT_LEVELS.mid.name,
    tagline: 'Défi intermédiaire',
    description:
      'Obstacles plus techniques, portés plus lourds, zones chrono conseillées. Pour hausser le ton sur ta distance.',
    stats: [
      { label: 'Obstacles', value: '25+ exigeants' },
      { label: 'Pénalités', value: 'À passer ou à payer' },
    ],
    highlights: ['Variantes techniques', 'Grip + explosivité', 'Esprit compétitif sans perdre la tribu'],
    difficultyClass: FORMAT_LEVELS.mid.badgeClass,
    gradient: FORMAT_LEVELS.mid.accentClass,
    border: 'border-amber-500/20',
    href: FORMAT_LEVELS.mid.path,
  },
  {
    name: FORMAT_LEVELS.hard.name,
    tagline: 'Engagement total',
    description:
      'Obstacles obligatoires, pénalités physiques, contrôle matériel. Pensé pour viser le haut du tableau sur n’importe quelle distance.',
    stats: [
      { label: 'Obstacles', value: '30+ premiums' },
      { label: 'Pénalités', value: 'Full physiques' },
    ],
    highlights: ['Briefing spécifique', 'Supervision rapprochée', 'Qualification possible'],
    difficultyClass: FORMAT_LEVELS.hard.badgeClass,
    gradient: FORMAT_LEVELS.hard.accentClass,
    border: 'border-red-500/25',
    href: FORMAT_LEVELS.hard.path,
  },
]

const heroImageSrc =
  'https://images.unsplash.com/photo-1762544968153-b9b47435fefd?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'

export const metadata = {
  title: 'Formats OverBound — Distances & Difficultés',
  description: 'Choisis ta distance, puis module la difficulté pour vivre l’expérience OverBound à ton intensité.',
}

export default function FormatsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      <section className="relative isolate overflow-hidden py-20 sm:py-24">
        <div className="absolute inset-0">
          <Image
            src={heroImageSrc}
            alt="Athlètes Overbound en pleine course"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-background/35 backdrop-blur-[3px]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/15 via-background/70 to-background" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary sm:text-sm">
              Formats OverBound
            </span>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Choisis ta distance, puis ton niveau de difficulté.
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Reprenant la DA immersive de nos obstacles : nature, boue, acier et tribu. Une même distance peut être courue en {FORMAT_LEVELS.low.name}, {FORMAT_LEVELS.mid.name} ou {FORMAT_LEVELS.hard.name}. Tu décides du mix effort / technicité.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="h-12 w-full sm:w-auto">
                <Link href="#distances">Voir les distances</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 w-full border-primary text-primary hover:bg-primary/10 sm:w-auto"
              >
                <Link href="#difficultes">Choisir la difficulté</Link>
              </Button>
            </div>

          </div>
        </div>
      </section>

      <div className="relative bg-white flex flex-col items-center justify-center">
        <Image
          src="/images/mountain-vector.svg"
          alt="Décor montagne"
          width={1600}
          height={800}
          className="relative -top-1 left-0 !w-[100vw] rotate-180"
          priority
        />
        <section id="distances" className="relative z-10 mx-auto w-screen max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pt-12 bg-white">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Étape 1</p>
              <h2 className="mt-2 text-3xl font-semibold text-black">Choisis ta distance signature.</h2>
              <p className="text-sm text-muted-foreground">Chaque distance conserve la même DA, mais tu pourras y appliquer la difficulté qui te convient.</p>
            </div>
            <Link
              href="/events"
              className="hidden rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white sm:inline-flex"
            >
              Voir les courses
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {distanceFormats.map((format) => (
              <Card
                key={format.name}
                className="group relative overflow-hidden border-border/60 bg-background/90 shadow-lg shadow-primary/5 backdrop-blur transition hover:-translate-y-1"
              >
                <CardContent className="relative flex h-full flex-col gap-4 p-6">
                  <Badge className={`${format.badge.className} w-fit`}>
                    {format.badge.label === 'Sprint' && <Sparkles className="mr-1 h-4 w-4" />}
                    {format.badge.label === 'Intermédiaire' && <Mountain className="mr-1 h-4 w-4" />}
                    {format.badge.label === 'Élite' && <Crown className="mr-1 h-4 w-4" />}
                    {format.badge.label === 'Famille' && <Users className="mr-1 h-4 w-4" />}
                    {format.badge.label}
                  </Badge>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-semibold tracking-tight">{format.name}</h3>
                    <p className="text-sm font-medium text-muted-foreground">{format.distance}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{format.description}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <Link href="/trainings/what-race-for-me" className="text-xs font-semibold text-primary hover:underline">
                      Trouver ma distance →
                    </Link>
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <Link href={format.href}>
                        Découvrir
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="difficultes" className="relative z-10 mx-auto w-screen max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Étape 2</p>
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold text-black">Applique ta difficulté sur la distance choisie.</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {FORMAT_LEVELS.low.name}, {FORMAT_LEVELS.mid.name} ou {FORMAT_LEVELS.hard.name} : tu modules l’exigence sur ta distance. Même parcours, variantes d’obstacles, pénalités et coaching adaptés.
                </p>
              </div>
              <Link
                href="/trainings/what-race-for-me"
                className="inline-flex items-center rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
              >
                M&apos;aider à choisir
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {difficulties.map((format) => (
              <Card
                key={format.name}
                className={`group relative overflow-hidden border-0 bg-background/80 shadow-xl shadow-primary/10 backdrop-blur ${format.border}`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${format.gradient} opacity-80`} />
                <CardContent className="relative flex flex-col gap-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {format.name}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold tracking-tight">{format.tagline}</h3>
                    <p className="text-sm text-muted-foreground">{format.description}</p>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    {format.stats.map((stat) => (
                      <div key={stat.label} className="rounded-2xl border border-border/60 bg-background/80 p-3">
                        <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{stat.label}</dt>
                        <dd className="text-base font-semibold">{stat.value}</dd>
                      </div>
                    ))}
                  </dl>

                  <ul className="space-y-3 text-sm text-foreground/90">
                    {format.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2">
                        <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button asChild size="sm" className="rounded-full px-4 py-2">
                      <Link href={format.href}>Découvrir les règles →</Link>
                    </Button>
                    <span className="text-xs font-semibold text-muted-foreground">
                      S&apos;applique à {distanceFormats.length} distances
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className=' max-w-7xl my-8 rounded-2xl border border-border/60 bg-background/30 pb-10'>
          <WhichDistanceForMe />
        </section>
       <Image
          src="/images/mountain-vector.svg"
          alt="Décor montagne"
          width={1600}
          height={800}
          className="relative -bottom-1 left-0 !w-[100vw]"
          priority
        />
      </div>
    </main>
  )
}
