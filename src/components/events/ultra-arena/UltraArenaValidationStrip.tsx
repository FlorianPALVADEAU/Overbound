'use client'

import { BellRing } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Props {
  isOnSale: boolean
  registeredCount: number | null
}

export function UltraArenaValidationStrip({ isOnSale, registeredCount }: Props) {
  return (
    <section className="py-6 sm:py-8">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-primary/35 bg-primary/10 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary">
              <BellRing className="h-4 w-4" />
            </span>
            <div className="space-y-2">
              <p className="text-sm font-bold text-foreground">
                Les premiers ont déjà pris leur place, fais vite !
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
