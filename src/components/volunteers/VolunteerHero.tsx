'use client'

import { PageHero } from '@/components/hero/PageHero'

const SHEET = [
  { label: 'Inscription', value: 'Offerte' },
  { label: 'Repas & boissons', value: 'Inclus' },
  { label: 'Créneaux', value: 'Matin, après-midi ou journée' },
  { label: 'Réponse', value: 'Sous 48 h' },
] as const

const SheetList = () => (
  <dl className="min-w-0 divide-y divide-border/60 rounded-2xl border border-primary/15 bg-card/85 px-5 shadow-2xl shadow-black/15 backdrop-blur">
    {SHEET.map((row) => (
      <div key={row.label} className="flex items-baseline justify-between gap-4 py-3.5">
        <dt className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{row.label}</dt>
        <dd className="min-w-0 text-right text-sm font-bold wrap-break-word">{row.value}</dd>
      </div>
    ))}
  </dl>
)

export function VolunteerHero() {
  return (
    <>
    <PageHero
      id="top"
      image={{ src: '/images/images/a-group-of-friend-celebrating-after-a-race.avif', alt: 'Un groupe d’amis célébrant ensemble après une course Overbound' }}
      eyebrow="Bénévoles Overbound"
      title={
        <>
          Tu ne cours pas. <span className="text-primary">Tu fais courir.</span>
        </>
      }
      description="Choisis ton poste et ton créneau, on te répond sous 48 h."
      actions={
        <>
          <a
            href="#candidature"
            className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-primary px-8 text-base font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
          >
            Postuler
          </a>
          <a
            href="#avantages"
            className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl border border-border/60 bg-background/45 px-8 text-base font-semibold text-foreground/90 backdrop-blur transition hover:bg-background/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
          >
            Ce que tu y gagnes
          </a>
        </>
      }
      aside={<SheetList />}
    />
    <div className="px-4 pt-6 sm:px-6 lg:hidden">
      <SheetList />
    </div>
    </>
  )
}
