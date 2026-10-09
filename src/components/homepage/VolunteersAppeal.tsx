import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Sun, Sunrise } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'

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
    <section id="volontaires" className="relative w-full overflow-hidden bg-neutral-950 text-white">
      <div className="grid lg:grid-cols-2 lg:items-stretch">
        {/* Photo + écussons : en haut sur mobile, colonne à droite sur desktop */}
        <div className="relative order-first p-4 lg:order-last lg:p-8">
          <div className="relative h-80 overflow-hidden rounded-2xl animate-in fade-in duration-700 sm:h-[26rem] lg:h-full lg:min-h-144">
            <Image
              src="/images/images/a-group-of-friend-celebrating-after-a-race.avif"
              alt="Trois membres de la tribu Overbound qui rient ensemble après la course"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover object-[45%_40%]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-t from-neutral-950/60 via-transparent to-transparent"
            />
            {PATCHES.map((patch) => (
              <span
                key={patch.label}
                className={cn(
                  'absolute animate-in zoom-in-50 fade-in fill-mode-backwards duration-500',
                  'bg-primary px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-black/40 sm:text-sm',
                  'outline-1 -outline-offset-3 outline-dashed outline-white/60',
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
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Volontaires</p>
          <h2 className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl">
            Vis la course de l&apos;intérieur.
          </h2>
          <p className="mt-4 max-w-md text-base text-gray-300">
            Sans équipe sur le terrain, pas de course. Rejoins ceux qui encouragent, assurent la
            sécurité et font tourner la journée.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-1 text-sm font-bold text-white">
            {MISSIONS.map((mission, index) => (
              <li key={mission} className="flex items-center gap-3">
                {index > 0 && <span aria-hidden="true" className="text-primary">/</span>}
                {mission}
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
              Ton créneau
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
              {SLOTS.map(({ label, icon: Icon }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-8 max-w-md border-l-2 border-primary pl-4 text-sm text-gray-300">
            En échange : <span className="font-bold text-white">100 % de réduction</span> sur ta
            prochaine course Overbound, un repas pour tenir la journée, et le pack de la tribu.
          </p>

          <div className="mt-8">
            <Button asChild size="lg" className="min-h-11 w-full sm:w-auto">
              <Link href="/volunteers#rejoindre">
                Je deviens volontaire
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-gray-400">Réponse sous 48 h.</p>
        </div>
      </div>
    </section>
  )
}

export default VolunteersAppeal
