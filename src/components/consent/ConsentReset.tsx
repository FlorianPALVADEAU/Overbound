'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { clearConsent, readConsent, writeConsent, type ConsentChoices } from './consent'

const PURPOSES: Array<{ key: keyof ConsentChoices; label: string; description: string }> = [
  {
    key: 'analytics',
    label: 'Mesure d’audience',
    description: 'Google Analytics et Google Tag Manager : pages vues, parcours, performance du site. Enregistrement anonymisé de certaines sessions pour corriger les bugs.',
  },
  {
    key: 'marketing',
    label: 'Publicité',
    description: 'Meta Pixel et envoi à Meta de tes achats (email chiffré) pour mesurer nos campagnes publicitaires.',
  },
]

export function ConsentReset() {
  const [choices, setChoices] = useState<ConsentChoices>({ analytics: false, marketing: false })
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const consent = readConsent()
    if (consent) setChoices({ analytics: consent.analytics, marketing: consent.marketing })
  }, [])

  const update = (next: ConsentChoices) => {
    setChoices(next)
    writeConsent(next)
    setMessage('Préférences enregistrées.')
  }

  const handleReset = () => {
    clearConsent()
    setChoices({ analytics: false, marketing: false })
    setMessage('Préférences réinitialisées. La bannière de consentement réapparaîtra au prochain chargement.')
  }

  return (
    <div id="preferences" className="scroll-mt-24 rounded-2xl border border-border bg-card/80 p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold">Gérer mes préférences</p>
          <p className="text-sm text-muted-foreground">
            Les cookies nécessaires au site ne peuvent pas être désactivés. Refuser les autres n’a aucune conséquence sur ton
            inscription.
          </p>
        </div>
        <ul className="space-y-4">
          {PURPOSES.map(({ key, label, description }) => (
            <li key={key} className="flex items-start justify-between gap-4">
              <div>
                <label htmlFor={`consent-${key}`} className="text-sm font-medium">
                  {label}
                </label>
                <p id={`consent-${key}-desc`} className="text-xs text-muted-foreground">
                  {description}
                </p>
              </div>
              <Switch
                id={`consent-${key}`}
                aria-describedby={`consent-${key}-desc`}
                checked={choices[key]}
                onCheckedChange={(checked) => update({ ...choices, [key]: checked })}
              />
            </li>
          ))}
        </ul>
        <Button size="sm" variant="ghost" className="min-h-11" onClick={handleReset}>
          Réinitialiser mon choix
        </Button>
        {message ? (
          <p role="status" className="text-xs text-muted-foreground">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
