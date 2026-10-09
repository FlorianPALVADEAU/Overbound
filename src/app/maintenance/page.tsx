import type { Metadata } from 'next'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/server'
import { readMaintenanceSettings } from '@/lib/maintenance/settings'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Maintenance en cours',
  robots: { index: false, follow: false },
}

const DEFAULT_MESSAGE = "On met le site à jour. Reviens dans un moment."

const formatEnd = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))

export default async function MaintenancePage() {
  const maintenance = await readMaintenanceSettings(supabaseAdmin(), { fresh: true })
  if (!maintenance.enabled) redirect('/')

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-black text-white">
      <Image
        src="/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-black/70" />

      <div className="relative flex h-full flex-col justify-between p-6 sm:p-10 lg:p-14">
        <Image src="/images/brand/totem_logo_white.png" alt="Overbound" width={64} height={64} priority className="h-auto w-14 sm:w-16" />

        <div className="max-w-3xl">
          <h1 className="text-balance break-words text-[clamp(2.75rem,10vw,7rem)] font-black uppercase leading-[0.92] tracking-tight">
            Retour
            <br />
            bientôt.
          </h1>
          <div className="mt-6 h-1 w-16 bg-primary" />
          <p className="mt-6 max-w-xl text-pretty text-lg text-white/85 sm:text-xl">{maintenance.message?.trim() || DEFAULT_MESSAGE}</p>
          {maintenance.estimated_end ? (
            <p className="mt-4 text-base text-white/60">
              Retour prévu <span className="font-bold text-white">{formatEnd(maintenance.estimated_end)}</span>
            </p>
          ) : null}
        </div>

        <p className="text-sm text-white/50">contact@overbound-race.com</p>
      </div>
    </div>
  )
}
