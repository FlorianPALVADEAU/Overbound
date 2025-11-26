import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const formatContent = {
  standard: {
    name: 'Standard',
    title: 'Format Standard',
    tagline: 'Découverte engagée',
    intro:
      'Le format Standard est fait pour découvrir OverBound sans sacrifier les sensations. Tu goûtes au combo course nature + obstacles iconiques, avec des franchissements accessibles et la possibilité d’adapter chaque difficulté.',
    highlights: [
      {
        title: 'Parcours',
        text: '6 à 8 km de sentiers, de boue et de zones techniques pensées pour garder le sourire tout en transpirant.',
      },
      {
        title: 'Obstacles',
        text: '20+ obstacles emblématiques (murs, cordes, monkey bar) avec des options de contournement si tu veux préserver l’expérience.',
      },
      {
        title: 'Accompagnement',
        text: 'Coachs et volontaires proches de toi, briefing rassurant et ambiance tribu pour te mettre en confiance.',
      },
    ],
    stats: ['Effort : ⭐⭐☆', 'Technique : ⭐⭐☆', 'Idéal pour : première OCR, teams', 'Temps moyen : 1h10 – 1h40'],
    target:
      'Parfait pour les curieuses et curieux, les groupes d’amis ou les teams corporate qui veulent partager un souvenir commun.',
  },
  guerrier: {
    name: 'Guerrier',
    title: 'Format Guerrier',
    tagline: 'Défi intermédiaire',
    intro:
      'Tu sais déjà courir dans la boue et tu veux passer un cran au-dessus ? Le format Guerrier te fait enchaîner portés plus lourds, obstacles plus techniques et segments de course plus longs.',
    highlights: [
      {
        title: 'Parcours',
        text: '8 à 12 km avec davantage de dénivelé et des sections roulantes pour travailler ta gestion de l’effort.',
      },
      {
        title: 'Obstacles',
        text: '25+ obstacles dont des variantes plus exigeantes (carry prolongé, monkey bar humide, walls inclinés).',
      },
      {
        title: 'Rythme',
        text: 'Zones chronométrées conseillées, départs plus serrés et ambiance compétitive sans perdre l’esprit tribu.',
      },
    ],
    stats: ['Effort : ⭐⭐⭐', 'Technique : ⭐⭐⭐', 'Idéal pour : habitués OCR, cross-trainings', 'Temps moyen : 1h20 – 2h00'],
    target:
      'À choisir si tu veux progresser rapidement, préparer une Spartan/Hyrox ou challenger ton équipe régulière.',
  },
  legende: {
    name: 'Légende',
    title: 'Format Légende',
    tagline: 'Engagement total',
    intro:
      'Le format Légende est réservé aux acharnés. Intensité maximale, obstacles premiums, portés lourds et supervision rapprochée : tu joues dans la cour des grands.',
    highlights: [
      {
        title: 'Parcours',
        text: '12 km et plus avec cumuls de dénivelé, sections en eau, portions nocturnes ou surprises logistiques.',
      },
      {
        title: 'Obstacles',
        text: '30+ obstacles avec variantes élites : rig suspendu, obstacles combinés, pénalités 100 % physiques en cas d’échec.',
      },
      {
        title: 'Contrôle',
        text: 'Check matériel, briefing spécifique, coaching dédié et potentielle qualification pour événements partenaires.',
      },
    ],
    stats: ['Effort : ⭐⭐⭐⭐', 'Technique : ⭐⭐⭐⭐', 'Idéal pour : OCR confirmés, teams élites', 'Temps moyen : 2h00 – 3h00'],
    target:
      'Le terrain de jeu des passionnés qui veulent repousser leurs limites ou viser un podium. Nécessite une prépa sérieuse.',
  },
}

type FormatSlug = keyof typeof formatContent

export function generateStaticParams() {
  return Object.keys(formatContent).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const format = formatContent[resolvedParams.slug as FormatSlug]
  if (!format) {
    return { title: 'Format OverBound' }
  }
  return {
    title: `${format.title} — OverBound`,
    description: format.intro,
  }
}

export default async function FormatDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const format = formatContent[resolvedParams.slug as FormatSlug]
  if (!format) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      <section className="relative isolate overflow-hidden py-16 sm:py-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8">
          <Link href="/events/formats" className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">
            ← Formats OverBound
          </Link>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{format.title}</h1>
          <p className="mt-2 text-base font-semibold text-primary">{format.tagline}</p>
          <p className="mt-4 max-w-3xl text-lg text-muted-foreground">{format.intro}</p>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {format.highlights.map((highlight) => (
            <article key={highlight.title} className="rounded-3xl border border-border/70 bg-background/90 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{highlight.title}</p>
              <p className="mt-2 text-sm text-foreground/90">{highlight.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 lg:flex-row lg:px-8">
          <div className="flex-1 rounded-3xl border border-border/70 bg-muted/20 p-6">
            <h2 className="text-xl font-semibold">À quoi t’attendre</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {format.stats.map((stat) => (
                <li key={stat} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  {stat}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 rounded-3xl border border-border/70 bg-background/90 p-6">
            <h2 className="text-xl font-semibold">Pour qui ?</h2>
            <p className="mt-3 text-sm text-muted-foreground">{format.target}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/events" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/80">
                Voir les courses
              </Link>
              <Link
                href="/trainings/what-race-for-me"
                className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
              >
                Je veux un conseil
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
