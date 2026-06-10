'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { clearConsent, readConsent, writeConsent } from './consent'

export function ConsentReset() {
  const [message, setMessage] = useState<string | null>(null)

  const handleEnable = () => {
    writeConsent(true)
    setMessage('Préférences enregistrées. Les cookies de mesure d’audience sont activés.')
  }

  const handleDisable = () => {
    writeConsent(false)
    setMessage('Préférences enregistrées. Les cookies de mesure d’audience sont désactivés.')
  }

  const handleReset = () => {
    clearConsent()
    setMessage('Préférences réinitialisées. La bannière de consentement réapparaîtra au prochain chargement.')
  }

  return (
    <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm">
      <div className="space-y-3">
        <p className="text-sm font-semibold">Gérer mes préférences</p>
        <p className="text-sm text-muted-foreground">
          Choisis si tu acceptes ou non les cookies de mesure d’audience. Tu peux aussi réinitialiser ton choix.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleEnable}>
            Autoriser l’audience
          </Button>
          <Button size="sm" variant="outline" onClick={handleDisable}>
            Refuser l’audience
          </Button>
          <Button size="sm" variant="ghost" onClick={handleReset}>
            Réinitialiser
          </Button>
        </div>
        {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      </div>
    </div>
  )
}
