import Image from 'next/image'
import { Container, Section, SectionHeader, DISPLAY_TITLE } from '@/components/ds'
import { cn } from '@/lib/utils'

const PERKS = [
  { title: 'Le kit volontaire', text: 'Tenue technique, repas, boissons.' },
  { title: 'Accès coulisses', text: 'Zones, briefs, arrivées : tu vois la course de l’intérieur.' },
  { title: 'L’équipe', text: 'Des rencontres et de l’entraide.' },
] as const

export function VolunteerPerks() {
  return (
    <Section id="avantages">
      <Container>
        <SectionHeader eyebrow="Avantages" title="Ce que tu reçois en échange" />

        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="relative isolate flex aspect-4/3 flex-col justify-end overflow-hidden rounded-2xl">
            <Image
              src="/images/images/two-sporty-mens-staring-at-the-camera-with-pride.avif"
              alt="Deux coureurs fiers face caméra après leur course"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="-z-20 object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-linear-to-t from-black/80 to-transparent" />
            <div className="p-5 sm:p-6">
              <h3 className={cn(DISPLAY_TITLE, 'text-display-md text-white')}>Une inscription offerte</h3>
              <p className="mt-1 text-foreground">Choisis ta course Overbound, ou offre-la à un proche.</p>
            </div>
          </div>

          <dl className="divide-y divide-white/10 border-y border-white/10">
            {PERKS.map((perk) => (
              <div key={perk.title} className="py-5">
                <dt className={cn(DISPLAY_TITLE, 'text-title')}>{perk.title}</dt>
                <dd className="mt-1 text-muted-foreground">{perk.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </Section>
  )
}
