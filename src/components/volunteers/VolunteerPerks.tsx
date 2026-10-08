import Image from 'next/image'
import { SectionHeading } from './SectionHeading'

const PERKS = [
  { title: 'Le kit volontaire', text: 'Tenue technique, repas, boissons.' },
  { title: 'Accès coulisses', text: 'Zones, briefs, arrivées : tu vois la course de l’intérieur.' },
  { title: 'L’équipe', text: 'Des rencontres et de l’entraide.' },
] as const

export function VolunteerPerks() {
  return (
    <section id="avantages" className="scroll-mt-20 bg-background py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 xl:px-0">
        <SectionHeading eyebrow="Avantages" title="Ce que tu reçois en échange" />

        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] items-center gap-8 lg:grid-cols-2 lg:gap-14">
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
              <h3 className="text-2xl font-black text-white sm:text-3xl">Une inscription offerte</h3>
              <p className="mt-1 text-gray-200">Choisis ta course Overbound, ou offre-la à un proche.</p>
            </div>
          </div>

          <dl className="divide-y divide-white/10 border-y border-white/10">
            {PERKS.map((perk) => (
              <div key={perk.title} className="py-5">
                <dt className="text-xl font-black text-white">{perk.title}</dt>
                <dd className="mt-1 text-gray-300">{perk.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
