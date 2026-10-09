'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface VolunteerBibProps {
  name: string
  mission: string
  eventLabel: string
  confirmed: boolean
  className?: string
}

export function VolunteerBib({ name, mission, eventLabel, confirmed, className }: VolunteerBibProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Légère inclinaison 3D au survol, désactivée pour prefers-reduced-motion.
  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = ref.current
    if (!node || event.pointerType !== 'mouse') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = node.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    node.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`
  }
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = ''
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn('relative transition-transform duration-200 ease-out motion-reduce:transition-none', className)}
    >
      <div className="relative overflow-hidden rounded-2xl bg-white text-neutral-950 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between bg-primary px-5 py-2 text-primary-foreground">
          <span className="text-xs font-black uppercase tracking-[0.3em]">Overbound</span>
          <span className="text-xs font-black uppercase tracking-[0.3em]">Tribu</span>
        </div>
        <span className="absolute left-3 top-14 h-3 w-3 rounded-full bg-neutral-300" aria-hidden />
        <span className="absolute right-3 top-14 h-3 w-3 rounded-full bg-neutral-300" aria-hidden />

        <div className="px-6 pb-6 pt-8">
          <p className="text-5xl font-black uppercase leading-none tracking-tight sm:text-6xl">Bénévole</p>

          <dl className="mt-6 space-y-4">
            <div>
              <dt className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500">Nom</dt>
              <dd
                className={cn(
                  'min-h-8 wrap-break-word text-2xl font-black leading-tight',
                  !name && 'text-neutral-300',
                )}
              >
                {name || 'Ton nom ici'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500">Poste</dt>
              <dd className="wrap-break-word text-lg font-black leading-tight text-primary">{mission}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500">Événement</dt>
              <dd className={cn('wrap-break-word text-base font-bold', !eventLabel && 'text-neutral-300')}>
                {eventLabel || 'À choisir'}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex h-10 items-end gap-0.5 opacity-80" aria-hidden>
            {Array.from({ length: 36 }).map((_, index) => (
              <span
                key={index}
                className="flex-1 bg-neutral-950"
                style={{ height: `${40 + ((index * 37) % 60)}%` }}
              />
            ))}
          </div>
        </div>

        {confirmed ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="-rotate-12 rounded-lg border-4 border-primary px-4 py-2 text-3xl font-black uppercase tracking-widest text-primary motion-safe:animate-[stamp_0.4s_ease-out]">
              Reçu !
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
