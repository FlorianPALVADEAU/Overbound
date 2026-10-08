'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { useParallax } from '@/hooks/useParallax'

const SHEET = [
  { label: 'Inscription', value: 'Offerte' },
  { label: 'Repas & boissons', value: 'Inclus' },
  { label: 'Créneaux', value: 'Matin, après-midi ou journée' },
  { label: 'Réponse', value: 'Sous 48 h' },
] as const

export function VolunteerHero() {
  const heroRef = useRef<HTMLElement>(null)
  const parallax = useParallax(heroRef)

  return (
    <section ref={heroRef} id="top" className="relative isolate overflow-hidden pb-14 pt-24 sm:pb-20 sm:pt-28 lg:pt-32">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 -m-8 scale-110 will-change-transform"
          style={{ transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)` }}
        >
          <Image
            src="/images/images/a-group-of-friend-celebrating-after-a-race.avif"
            alt="Un groupe d’amis célébrant ensemble après une course Overbound"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-35"
          />
        </div>
        <div className="absolute inset-0 bg-linear-to-b from-background/20 via-background/82 to-background" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl min-w-0 items-end gap-10 px-4 sm:px-6 lg:grid-cols-[1.3fr_0.7fr] lg:px-8">
        <div className="min-w-0 space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Bénévoles Overbound</p>
          <h1 className="max-w-3xl text-balance wrap-break-word text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Tu ne cours pas. <span className="text-primary">Tu fais courir.</span>
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Choisis ton poste et ton créneau, on te répond sous 48 h.
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <a
              href="#candidature"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-primary px-8 text-base font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Postuler
            </a>
            <a
              href="#avantages"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-border/60 bg-background/45 px-8 text-base font-semibold text-foreground/90 backdrop-blur transition hover:bg-background/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Ce que tu y gagnes
            </a>
          </div>
        </div>

        <dl className="min-w-0 divide-y divide-border/60 rounded-2xl border border-primary/15 bg-card/85 px-5 shadow-2xl shadow-black/15 backdrop-blur">
          {SHEET.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 py-3.5">
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{row.label}</dt>
              <dd className="min-w-0 text-right text-sm font-bold wrap-break-word">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
