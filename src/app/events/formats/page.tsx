import Link from 'next/link'

const formats = [
  {
    name: 'Standard',
    tagline: 'Découverte engagée',
    description:
      'Idéal pour entrer dans la tribu OverBound. Tu alternes course nature et obstacles iconiques avec des options de contournement pour privilégier le plaisir et la confiance.',
    details: ['6 à 8 km', '20+ obstacles', 'Accompagnement volontaire'],
    href: '/events/formats/standard',
  },
  {
    name: 'Guerrier',
    tagline: 'Défi intermédiaire',
    description:
      'Tu connais déjà la boue et tu veux hausser le ton. Les obstacles sont plus techniques, les portés plus lourds et la gestion de ton énergie devient essentielle.',
    details: ['8 à 12 km', '25+ obstacles', 'Chrono conseillé'],
    href: '/events/formats/guerrier',
  },
  {
    name: 'Légende',
    tagline: 'Engagement total',
    description:
      'Format signature réservé aux acharnés. Intensité maximale, obstacles premium et supervision rapprochée : tu joues dans la cour des grands.',
    details: ['12 km et +', '30+ obstacles', 'Qualification possible'],
    href: '/events/formats/legende',
  },
]

export const metadata = {
  title: 'Formats OverBound — Standard, Guerrier, Légende',
  description: 'Choisis le format de course qui correspond à ton niveau et à ton envie de dépassement.',
}

export default function FormatsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background/80 to-background text-foreground">
      <section className="relative isolate overflow-hidden py-16 sm:py-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Formats de course</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Choisis ta manière d&apos;écrire l&apos;histoire.
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
            Standard pour découvrir, Guerrier pour monter en puissance, Légende pour repousser toute limite.
            Chaque format partage l&apos;ADN OverBound : obstacles iconiques, esprit de tribu et accompagnement terrain.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {formats.map((format) => (
            <article
              key={format.name}
              className="flex flex-col rounded-3xl border border-border/70 bg-background/90 p-6 shadow-sm ring-1 ring-transparent transition hover:-translate-y-1 hover:ring-primary/40"
            >
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                {format.name}
              </div>
              <h2 className="mt-4 text-2xl font-semibold">{format.tagline}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{format.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                {format.details.map((detail) => (
                  <li key={detail} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {detail}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-3 pt-6">
                <Link href={format.href} className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
                  Explorer le format →
                </Link>
                <Link href="/events" className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground">
                  Voir les courses compatibles
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/10 py-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 text-center lg:px-8">
          <h2 className="text-3xl font-semibold">Besoin d&apos;aide pour choisir ?</h2>
          <p className="text-base text-muted-foreground">
            Partage-nous ton expérience, ton équipe et tes envies. On t&apos;oriente vers le format qui fera vibrer ta tribu.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/trainings/what-race-for-me"
              className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
            >
              Trouver mon format
            </Link>
            <Link
              href="/events"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/80"
            >
              Voir le calendrier
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
