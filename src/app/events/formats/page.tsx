import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Mountain, Sparkles, Crown, Users } from 'lucide-react'
import WhichDistanceForMe from '@/components/WhichDistanceForMe'
import { FORMAT_LEVELS } from '@/constants/formatLevels'
import { RACE_FORMATS, FormatTemplate } from '@/constants/raceFormats'

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
  },
  {
    name: FORMAT_LEVELS.mid.name,
    tagline: 'Défi intermédiaire',
    description:
      'Obstacles plus techniques, portés plus lourds, zones chrono conseillées. Pour hausser le ton sur ta distance.',
    stats: [
      { label: 'Obstacles', value: 'Exigeants' },
      { label: 'Pénalités', value: 'Exigeantes' },
    ],
    highlights: ['Variantes techniques', 'Grip + explosivité', 'Esprit compétitif sans perdre la tribu'],
    difficultyClass: FORMAT_LEVELS.mid.badgeClass,
    gradient: FORMAT_LEVELS.mid.accentClass,
    border: 'border-amber-500/20',
  },
  {
    name: FORMAT_LEVELS.hard.name,
    tagline: 'Engagement total',
    description:
      'Obstacles obligatoires, pénalités physiques, contrôle matériel. Pensé pour viser le haut du tableau sur n’importe quelle distance.',
    stats: [
      { label: 'Obstacles', value: 'Premiums' },
      { label: 'Pénalités', value: 'Full physiques' },
    ],
    highlights: ['Briefing spécifique', 'Supervision rapprochée', 'Idéal sportif aguérri'],
    difficultyClass: FORMAT_LEVELS.hard.badgeClass,
    gradient: FORMAT_LEVELS.hard.accentClass,
    border: 'border-red-500/25',
  },
]

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
            src={"/images/images/a-young-men-carrying-a-wooden-log-on-his-shoulder-staring-at-the-camera.avif"}
            alt="Un coureur d'OverBound portant un tronc d'arbre sur son épaule et regardant la caméra d'un air déterminé"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-background/35 backdrop-blur-[3px]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/15 via-background/70 to-background" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="py-20 relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
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
          src="/images/decorations/mountain-vector.svg"
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
            {distanceFormats.map((format, index) => (
              <Link key={format.name + index} href={"#"} className="group block h-full">
                <Card className="relative h-full overflow-hidden border-border/60 bg-background/90 shadow-lg shadow-primary/5 backdrop-blur transition hover:-translate-y-1">
                  <CardContent className="relative flex h-full flex-col gap-4 p-6">
                    <Badge className={`${format.badge.className} w-fit`}>
                      {format.badge.label === 'Sprint' && <Sparkles className="mr-1 h-4 w-4" />}
                      {format.badge.label === 'Intermédiaire' && <Mountain className="mr-1 h-4 w-4" />}
                      {format.badge.label === 'Élite' && <Crown className="mr-1 h-4 w-4" />}
                      {format.badge.label === 'Famille' && <Users className="mr-1 h-4 w-4" />}
                      {format.badge.label}
                    </Badge>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-semibold tracking-tight group-hover:underline">{format.name}</h3>
                      <p className="text-sm font-medium text-muted-foreground">{format.distance}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{format.description}</p>
                  </CardContent>
                </Card>
              </Link>
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
                className={`group relative overflow-hidden border-0 shadow-xl shadow-primary/10 backdrop-blur ${format.border}`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${format.gradient} opacity-80`} />
                <CardContent className="relative flex flex-col gap-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {format.tagline}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold tracking-tight">{format.name}</h3>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Comparison Table Section */}
        <section className="relative z-10 mx-auto w-screen max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Tableau comparatif</p>
            <h2 className="mt-2 text-3xl font-semibold text-black">Comparaison détaillée des distances</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Vue d'ensemble complète pour t'aider à choisir la distance qui correspond le mieux à tes capacités et objectifs
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/60 shadow-xl">
            <table className="w-full border-collapse bg-card">
              <thead>
                <tr className="bg-muted/50">
                  <th className="sticky left-0 z-10 bg-muted/50 p-4 text-left text-sm font-semibold text-foreground">
                    Critère
                  </th>
                  {(['origin', 'horizon', 'ultra-arena', 'tribal-kids'] as FormatTemplate[]).map((formatId) => {
                    const format = RACE_FORMATS[formatId]
                    const badgeClasses = formatId === 'origin'
                      ? 'mx-auto w-fit bg-green-500/20 text-green-700'
                      : formatId === 'horizon'
                      ? 'mx-auto w-fit bg-blue-500/20 text-blue-700'
                      : formatId === 'ultra-arena'
                      ? 'mx-auto w-fit bg-amber-500 text-white'
                      : 'mx-auto w-fit bg-purple-500/20 text-purple-700'
                    const badgeLabel = formatId === 'origin'
                      ? 'Sprint'
                      : formatId === 'horizon'
                      ? 'Intermédiaire'
                      : formatId === 'ultra-arena'
                      ? 'Élite'
                      : 'Famille'
                    return (
                      <th key={formatId} className="p-4 text-center text-sm font-semibold text-foreground">
                        <div className="flex flex-col gap-1">
                          <span>{format.name}</span>
                          <Badge className={badgeClasses}>{badgeLabel}</Badge>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {/* Distance */}
                <tr className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-card p-4 font-medium text-foreground">Distance</td>
                  {(['origin', 'horizon', 'ultra-arena', 'tribal-kids'] as FormatTemplate[]).map((formatId) => {
                    const format = RACE_FORMATS[formatId]
                    const distance = format.statsCards.find(s => s.label === 'Distance')?.value || '-'
                    return (
                      <td key={formatId} className="p-4 text-center text-sm text-muted-foreground">
                        {distance}
                      </td>
                    )
                  })}
                </tr>

                {/* Obstacles */}
                <tr className="border-t border-border bg-muted/20">
                  <td className="sticky left-0 z-10 bg-muted/20 p-4 font-medium text-foreground">Obstacles</td>
                  {(['origin', 'horizon', 'ultra-arena', 'tribal-kids'] as FormatTemplate[]).map((formatId) => {
                    const format = RACE_FORMATS[formatId]
                    const obstacles = format.statsCards.find(s => s.label === 'Obstacles')?.value || '-'
                    return (
                      <td key={formatId} className="p-4 text-center text-sm text-muted-foreground">
                        {obstacles}
                      </td>
                    )
                  })}
                </tr>

                {/* Temps estimé */}
                <tr className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-card p-4 font-medium text-foreground">Temps estimé</td>
                  {(['origin', 'horizon', 'ultra-arena', 'tribal-kids'] as FormatTemplate[]).map((formatId) => {
                    const format = RACE_FORMATS[formatId]
                    const timeMin = format.estimatedTimeMin
                    const timeMax = format.estimatedTimeMax
                    const time = timeMin && timeMax ? `${timeMin}-${timeMax} min` : 'Variable'
                    return (
                      <td key={formatId} className="p-4 text-center text-sm text-muted-foreground">
                        {time}
                      </td>
                    )
                  })}
                </tr>

                {/* Type de parcours */}
                <tr className="border-t border-border bg-muted/20">
                  <td className="sticky left-0 z-10 bg-muted/20 p-4 font-medium text-foreground">Type de parcours</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Trail + obstacles</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Trail + obstacles</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Boucle répétitive</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Parcours sécurisé</td>
                </tr>

                {/* Grip/Préhension */}
                <tr className="border-t border-border bg-muted/20">
                  <td className="sticky left-0 z-10 bg-muted/20 p-4 font-medium text-foreground">Grip/Préhension</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Modéré</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Important</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Extrême</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Minimal</td>
                </tr>

                {/* Endurance cardio */}
                <tr className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-card p-4 font-medium text-foreground">Endurance cardio</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">6/10</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">8/10</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">10/10</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">3/10</td>
                </tr>

                {/* Force requise */}
                <tr className="border-t border-border bg-muted/20">
                  <td className="sticky left-0 z-10 bg-muted/20 p-4 font-medium text-foreground">Force requise</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">6/10</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">7/10</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">5/10</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">3/10</td>
                </tr>

                {/* Agilité/Technique */}
                <tr className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-card p-4 font-medium text-foreground">Agilité/Technique</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">6/10</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">7/10</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">6/10</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">4/10</td>
                </tr>

                {/* Mental requis */}
                <tr className="border-t border-border bg-muted/20">
                  <td className="sticky left-0 z-10 bg-muted/20 p-4 font-medium text-foreground">Mental requis</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">6/10</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">7/10</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">10/10</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">2/10</td>
                </tr>


                {/* Âge minimum */}
                <tr className="border-t border-border bg-muted/20">
                  <td className="sticky left-0 z-10 bg-muted/20 p-4 font-medium text-foreground">Âge minimum</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">16 ans</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">16 ans</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">18 ans</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">6 ans</td>
                </tr>

                {/* Préparation recommandée */}
                <tr className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-card p-4 font-medium text-foreground">Préparation recommandée</td>
                  {(['origin', 'horizon', 'ultra-arena', 'tribal-kids'] as FormatTemplate[]).map((formatId) => {
                    const format = RACE_FORMATS[formatId]
                    const weeks = format.prerequisites?.trainingWeeks || 0
                    const preparation = weeks === 0
                      ? 'Aucune'
                      : weeks < 6
                      ? `${weeks} semaines`
                      : weeks >= 24
                      ? '6+ mois'
                      : `${weeks} semaines`
                    return (
                      <td key={formatId} className="p-4 text-center text-sm text-muted-foreground">
                        {preparation}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Difficulty Levels Comparison Table Section */}
        <section className="relative z-10 mx-auto w-screen max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Tableau comparatif</p>
            <h2 className="mt-2 text-3xl font-semibold text-black">Comparaison détaillée des niveaux de difficulté</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Compare les trois niveaux de difficulté pour choisir celui qui correspond à ton expérience et tes objectifs
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/60 shadow-xl">
            <table className="w-full border-collapse bg-card">
              <thead>
                <tr className="bg-muted/50">
                  <th className="sticky left-0 z-10 bg-muted/50 p-4 text-left text-sm font-semibold text-foreground">
                    Critère
                  </th>
                  <th className="p-4 text-center text-sm font-semibold text-foreground">
                    <div className="flex flex-col gap-1">
                      <span>{FORMAT_LEVELS.low.name}</span>
                      <Badge className={`mx-auto w-fit ${FORMAT_LEVELS.low.badgeClass}`}>Découverte</Badge>
                    </div>
                  </th>
                  <th className="p-4 text-center text-sm font-semibold text-foreground">
                    <div className="flex flex-col gap-1">
                      <span>{FORMAT_LEVELS.mid.name}</span>
                      <Badge className={`mx-auto w-fit ${FORMAT_LEVELS.mid.badgeClass}`}>Intermédiaire</Badge>
                    </div>
                  </th>
                  <th className="p-4 text-center text-sm font-semibold text-foreground">
                    <div className="flex flex-col gap-1">
                      <span>{FORMAT_LEVELS.hard.name}</span>
                      <Badge className={`mx-auto w-fit ${FORMAT_LEVELS.hard.badgeClass}`}>Élite</Badge>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Obstacles */}
                <tr className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-card p-4 font-medium text-foreground">Type d'obstacles</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Adaptables</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Exigeants</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Premiums</td>
                </tr>

                {/* Pénalités */}
                <tr className="border-t border-border bg-muted/20">
                  <td className="sticky left-0 z-10 bg-muted/20 p-4 font-medium text-foreground">Pénalités</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Souples</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Exigeantes</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Full physiques</td>
                </tr>

                {/* Contournements */}
                <tr className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-card p-4 font-medium text-foreground">Contournements</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Possibles</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Limités</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Interdits</td>
                </tr>

                {/* Coaching */}
                <tr className="border-t border-border bg-muted/20">
                  <td className="sticky left-0 z-10 bg-muted/20 p-4 font-medium text-foreground">Coaching</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Rapproché</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Standard</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Supervision spécifique</td>
                </tr>

                {/* Briefing */}
                <tr className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-card p-4 font-medium text-foreground">Briefing</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Rassurant et détaillé</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Standard</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Technique et spécifique</td>
                </tr>

                {/* Niveau technique requis */}
                <tr className="border-t border-border bg-muted/20">
                  <td className="sticky left-0 z-10 bg-muted/20 p-4 font-medium text-foreground">Niveau technique requis</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">3/10</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">6/10</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">9/10</td>
                </tr>

                {/* Effort physique */}
                <tr className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-card p-4 font-medium text-foreground">Effort physique</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Modéré</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Important</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Maximal</td>
                </tr>

                {/* Mental requis */}
                <tr className="border-t border-border bg-muted/20">
                  <td className="sticky left-0 z-10 bg-muted/20 p-4 font-medium text-foreground">Mental requis</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">4/10</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">7/10</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">10/10</td>
                </tr>

                {/* Grip/Préhension */}
                <tr className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-card p-4 font-medium text-foreground">Grip/Préhension</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Basique</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Important</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Extrême</td>
                </tr>

                {/* Portés */}
                <tr className="border-t border-border bg-muted/20">
                  <td className="sticky left-0 z-10 bg-muted/20 p-4 font-medium text-foreground">Portés</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Légers ou optionnels</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Moyens à lourds</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Très lourds</td>
                </tr>

                {/* Esprit de course */}
                <tr className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-card p-4 font-medium text-foreground">Esprit de course</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Ambiance tribu</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Compétitif mais tribu</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Compétition intense</td>
                </tr>

                {/* Type de compétiteur visé */}
                <tr className="border-t border-border bg-muted/20">
                  <td className="sticky left-0 z-10 bg-muted/20 p-4 font-medium text-foreground">Profil visé</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Débutants, teams, découverte</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Confirmés, progression</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Athlètes, podium</td>
                </tr>

                {/* Qualification */}
                {/* <tr className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-card p-4 font-medium text-foreground">Qualification possible</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Non</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Non</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Oui</td>
                </tr> */}

                {/* Zones chrono */}
                {/* <tr className="border-t border-border bg-muted/20">
                  <td className="sticky left-0 z-10 bg-muted/20 p-4 font-medium text-foreground">Zones chrono</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Non</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Conseillées</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Obligatoires</td>
                </tr> */}

                {/* Contrôle matériel */}
                <tr className="border-t border-border">
                  <td className="sticky left-0 z-10 bg-card p-4 font-medium text-foreground">Contrôle matériel</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Non</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Recommandé</td>
                  <td className="p-4 text-center text-sm text-muted-foreground">Obligatoire</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className=' max-w-7xl my-8 rounded-2xl border border-border/60 bg-background/30 pb-10'>
          <WhichDistanceForMe />
        </section>
       <Image
          src="/images/decorations/mountain-vector.svg"
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
