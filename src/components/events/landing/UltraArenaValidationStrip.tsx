'use client'

import { BellRing } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { LANDING_X } from './layout'

interface Props {
  isOnSale: boolean
  registeredCount: number | null
  availableSpots: number
}

export function UltraArenaValidationStrip({ isOnSale, registeredCount, availableSpots }: Props) {
  return (
    <section className="py-6 sm:py-8">
      <div className={`${LANDING_X}`}>
        <div className="rounded-xl border border-primary/35 bg-primary/10 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary">
              <BellRing className="h-4 w-4" />
            </span>
            <div className="space-y-2">
              <p className="text-sm font-bold text-foreground">
                {isOnSale
                  ? availableSpots > 0
                    ? `${availableSpots} places disponibles sur ce format`
                    : 'Complet sur ce format'
                  : "Inscriptions pas encore ouvertes"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{isOnSale ? 'Inscriptions ouvertes' : 'Ouverture à venir'}</Badge>
                {registeredCount !== null && registeredCount > 0 ? (
                  <Badge variant="secondary">{registeredCount} inscrits</Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
