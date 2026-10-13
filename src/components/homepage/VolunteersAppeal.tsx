import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Sun, Sunrise } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import { Section, SectionHeader } from '@/components/ds'

const PATCHES = [
  { label: 'Place offerte', className: 'bottom-4 left-4 -rotate-3', delay: '300ms' },
  { label: 'Pack volontaire', className: 'bottom-16 right-4 rotate-2', delay: '500ms' },
  { label: 'Repas offert', className: 'bottom-4 right-6 -rotate-2', delay: '700ms' },
] as const

const SLOTS = [
  { label: 'Matin', icon: Sunrise },
  { label: 'Après-midi', icon: Sun },
  { label: 'Journée complète', icon: CalendarDays },
]

const MISSIONS = ['Obstacles', 'Village & accueil', 'Ravitos & finish']

const VolunteersAppeal = () => {
  return (
    <Section id="volontaires" tone="deep" spacing="none">
      <div className="grid lg:grid-cols-2 lg:items-stretch">
        {/* Photo + écussons : en haut sur mobile, colonne à droite sur desktop */}
        <div className="relative order-first p-4 lg:order-last lg:p-8">
          <div className="relative h-80 overflow-hidden rounded-2xl animate-in fade-in duration-700 sm:h-[26rem] lg:h-full lg:min-h-144">
            <Image
              src="/images/images/a-group-of-friend-celebrating-after-a-race.webp"
              alt="Trois membres de la tribu Overbound qui rient ensemble après la course"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover object-[45%_40%]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-t from-surface-deep/60 via-transparent to-transparent"
            />
            {PATCHES.map((patch) => (
              <span
                key={patch.label}
                className={cn(
                  'absolute animate-in zoom-in-50 fade-in fill-mode-backwards duration-500',
                  'bg-primary px-3 py-2 font-display text-sm font-bold uppercase text-primary-foreground shadow-lg shadow-black/40',
                  'outline-1 -outline-offset-3 outline-dashed outline-foreground/60',
                  patch.className,
                )}
                style={{ animationDelay: patch.delay }}
              >
                {patch.label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative px-4 pb-16 pt-4 sm:px-6 lg:py-20 lg:pl-[max(2rem,calc((100vw-72rem)/2))] lg:pr-4 xl:pr-8">
          <SectionHeader
            flush
            eyebrow="Volontaires"
            title="Vis la course de l'intérieur."
            lead="Sans équipe sur le terrain, pas de course. Rejoins ceux qui encouragent, assurent la sécurité et font tourner la journée."
            className="max-w-md"
          />

          <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold text-foreground">
            {MISSIONS.map((mission, index) => (
              <li key={mission} className="flex items-center gap-3">
                {index > 0 && <span aria-hidden="true" className="text-primary">/</span>}
                {mission}
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <p className="text-label font-semibold uppercase text-subtle">
              Ton créneau
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
              {SLOTS.map(({ label, icon: Icon }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-8 max-w-md border-l-2 border-primary pl-4 text-sm text-muted-foreground">
            En échange : <span className="font-semibold text-foreground">100 % de réduction</span> sur ta
            prochaine course Overbound, un repas pour tenir la journée, et le pack de la tribu.
          </p>

          <div className="mt-8">
            <Button asChild size="cta" className="w-full sm:w-auto">
              <Link href="/volunteers#rejoindre">
                Je deviens volontaire
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-subtle">Réponse sous 48 h.</p>
        </div>
      </div>
    </Section>
  )
}

export default VolunteersAppeal
