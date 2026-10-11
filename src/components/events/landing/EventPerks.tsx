import { CardCarousel } from '@/components/shared/CardCarousel'
import { Container, DISPLAY_TITLE, Pill, SectionHeader } from '@/components/ds'
import { cn } from '@/lib/utils'

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
    <Container>
      <SectionHeader eyebrow="Ce que tu gagnes" title="Tu repars avec bien plus qu&apos;un dossard." flush />

      <div className="mt-10 sm:mt-12">
        <CardCarousel
          items={PERKS}
          getKey={(perk) => perk.title}
          roomy
          autoplayMs={4500}
          contentClassName="-ml-3 pb-24"
          itemClassName="pl-3 basis-[82%] sm:basis-[48%] lg:basis-[32%]"
          renderItem={({ title, text, tag }, index) => (
            <div
              className={cn(
                'flex h-full min-h-64 flex-col justify-between rounded-2xl border p-6 backdrop-blur-sm',
                tag === 'Inclus' ? 'border-primary/50 bg-surface-deep/60' : 'border-dashed border-foreground/25 bg-surface-deep/40',
              )}
            >
              <div className="flex items-start justify-between">
                <span
                  aria-hidden
                  className="font-display text-6xl font-bold leading-none text-primary/35"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Pill variant={tag === 'Inclus' ? 'tag' : 'tag-muted'}>{tag}</Pill>
              </div>
              <div className="mt-8 min-w-0">
                <p className={cn(DISPLAY_TITLE, 'text-title')}>{title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          )}
        />
      </div>
    </Container>
  )
}
