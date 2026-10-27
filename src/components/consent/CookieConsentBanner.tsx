'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useBlockingOverlay } from '@/components/popups/PopupArbiterProvider'
import { readConsent, writeConsent } from './consent'

export function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const consent = readConsent()
    setIsOpen(!consent)
  }, [])

  // Cookies first: no popup (Lucky Wheel, promotion) opens over the banner.
  useBlockingOverlay(isOpen)

  if (!isOpen) return null

  const choose = (accepted: boolean) => {
    writeConsent({ analytics: accepted, marketing: accepted })
    setIsOpen(false)
  }

  return (
    <div
      role="region"
      aria-label="Gestion des cookies"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-background/95 p-4 shadow-xl sm:p-6 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="hidden text-sm font-semibold sm:block">Gestion des cookies</p>
            <p className="text-sm text-muted-foreground">
              Cookies de mesure d’audience et de publicité (Google Analytics, Meta), avec ton accord. Tu peux modifier ton choix
              à tout moment.
            </p>
            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              <Link href="/cookies#preferences" className="inline-flex min-h-11 items-center underline underline-offset-4">
                Personnaliser
              </Link>
              <Link href="/cookies" className="inline-flex min-h-11 items-center underline underline-offset-4">
                Politique cookies
              </Link>
              <Link href="/privacy-policies" className="inline-flex min-h-11 items-center underline underline-offset-4">
                Confidentialité
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button variant="outline" className="min-h-11 px-4 sm:min-w-36 sm:px-6" onClick={() => choose(false)}>
              Tout refuser
            </Button>
            <Button variant="outline" className="min-h-11 px-4 sm:min-w-36 sm:px-6" onClick={() => choose(true)}>
              Tout accepter
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
