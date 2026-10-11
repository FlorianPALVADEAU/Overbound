'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { readConsent, writeConsent } from './consent'

export function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const consent = readConsent()
    setIsOpen(!consent)
  }, [])

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
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-background/95 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Gestion des cookies</p>
            <p className="text-sm text-muted-foreground">
              Nous utilisons des cookies nécessaires au fonctionnement du site et, avec ton accord, des cookies de mesure
              d’audience et de publicité (Google Analytics, Meta). Tu peux choisir par finalité et modifier ton choix à
              tout moment.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="min-h-11 min-w-36 px-6" onClick={() => choose(false)}>
              Tout refuser
            </Button>
            <Button variant="outline" className="min-h-11 min-w-36 px-6" onClick={() => choose(true)}>
              Tout accepter
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
