import { CardCarousel } from '@/components/shared/CardCarousel'
import { LANDING_X } from './layout'
import { SectionEyebrow } from './SectionEyebrow'

interface Perk {
  title: string
  text: string
  tag: 'Inclus' | 'En option'
}

const PERKS: Perk[] = [
  { title: 'Dossard officiel', text: 'Avec QR code pour le retrait et le chrono.', tag: 'Inclus' },
  { title: 'Médaille finisher', text: 'Remise à ton arrivée, quel que soit ton nombre de tours.', tag: 'Inclus' },
  { title: 'Chronométrage', text: 'Tes tours et ton résultat sur le parcours.', tag: 'Inclus' },
  { title: 'Accès au village', text: 'Zones de repos, ambiance et restauration.', tag: 'Inclus' },
  { title: 'T-shirt', text: "Le t-shirt de l'événement, à ajouter à l'étape Options.", tag: 'En option' },
  { title: 'Pack photo', text: 'Tes photos de course en haute définition, après l’événement.', tag: 'En option' },
]

/** What the entry includes and the options offered at registration, as a slider. */
export function EventPerks() {
  return (
    <div className={`${LANDING_X} py-16 sm:py-20`}>
      <SectionEyebrow>Ce que tu gagnes</SectionEyebrow>
      <h2 className="mt-2 text-balance text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
        Tu repars avec bien plus qu&apos;un dossard.
      </h2>

      <div className="mt-10">
        <CardCarousel
          items={PERKS}
          getKey={(perk) => perk.title}
          roomy
          autoplayMs={4500}
          contentClassName="-ml-3 pb-24"
          itemClassName="pl-3 basis-[82%] sm:basis-[48%] lg:basis-[32%]"
          renderItem={({ title, text, tag }, index) => (
            <div
              className={`flex h-full min-h-64 flex-col justify-between rounded-2xl border p-6 backdrop-blur-sm sm:p-7 ${
                tag === 'Inclus' ? 'border-primary/50 bg-black/55' : 'border-dashed border-white/25 bg-black/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <span
                  aria-hidden
                  className="text-6xl font-black leading-none text-primary/35"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                    tag === 'Inclus' ? 'bg-primary text-primary-foreground' : 'border border-white/30 text-white/80'
                  }`}
                >
                  {tag}
                </span>
              </div>
              <div className="mt-8 min-w-0">
                <p className="text-xl font-black uppercase tracking-tight">{title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  )
}
