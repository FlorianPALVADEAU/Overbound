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

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-background/95 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Gestion des cookies</p>
            <p className="text-sm text-muted-foreground">
              Nous utilisons des cookies nécessaires au fonctionnement du site et, avec ton accord,
              des cookies de mesure d’audience. Tu peux modifier ton choix à tout moment.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <Link href="/cookies" className="underline-offset-4 hover:underline">Politique cookies</Link>
              <Link href="/privacy-policies" className="underline-offset-4 hover:underline">Confidentialité</Link>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                writeConsent(false)
                setIsOpen(false)
              }}
            >
              Refuser
            </Button>
            <Button
              onClick={() => {
                writeConsent(true)
                setIsOpen(false)
              }}
            >
              Accepter
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
