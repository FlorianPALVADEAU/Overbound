'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences'
import { NOTIFICATION_PREFERENCE_TOGGLES, DIGEST_FREQUENCY_OPTIONS } from '@/types/NotificationPreferences'
import type { DigestFrequency } from '@/types/NotificationPreferences'

type LocalPreferences = {
  events_announcements: boolean
  price_alerts: boolean
  news_blog: boolean
  volunteers_opportunities: boolean
  partner_offers: boolean
  digest_frequency: DigestFrequency
}

const DEFAULT_PREFERENCES: LocalPreferences = {
  events_announcements: false,
  price_alerts: false,
  news_blog: false,
  volunteers_opportunities: false,
  partner_offers: false,
  digest_frequency: 'immediate',
}

const SAVED_FEEDBACK_MS = 3000

/** Marketing email choices. Transactional emails (tickets, security) are always sent. */
export default function PreferencesForm() {
  const router = useRouter()
  const { preferences, isLoading: isFetchingPrefs, fetchPreferences, updatePreferences } = useNotificationPreferences()

  const [local, setLocal] = useState<LocalPreferences>(DEFAULT_PREFERENCES)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  useEffect(() => {
    if (!preferences) return
    setLocal({
      events_announcements: preferences.events_announcements,
      price_alerts: preferences.price_alerts,
      news_blog: preferences.news_blog,
      volunteers_opportunities: preferences.volunteers_opportunities,
      partner_offers: preferences.partner_offers,
      digest_frequency: preferences.digest_frequency,
    })
  }, [preferences])

  const hasChanges = preferences
    ? (Object.keys(local) as Array<keyof LocalPreferences>).some((key) => local[key] !== preferences[key])
    : false

  const save = async () => {
    setIsSaving(true)
    setStatus(null)
    try {
      const result = await updatePreferences(local)
      if (!result.success) throw new Error(result.error || 'Impossible d’enregistrer tes préférences.')
      setStatus({ type: 'success', message: 'Préférences enregistrées.' })
      router.refresh()
      setTimeout(() => setStatus(null), SAVED_FEEDBACK_MS)
    } catch (error) {
      console.error('Save preferences error:', error)
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Une erreur est survenue.' })
    } finally {
      setIsSaving(false)
    }
  }

  const disabled = isSaving || isFetchingPrefs

  return (
    <div className="space-y-6">
      <ul>
        {NOTIFICATION_PREFERENCE_TOGGLES.map((toggle) => (
          <li key={toggle.key} className="flex min-h-16 items-center justify-between gap-4 border-t border-border py-3 first:border-t-0">
            <div className="min-w-0">
              <Label htmlFor={toggle.key} className="text-base font-semibold">
                {toggle.label}
              </Label>
              <p className="mt-0.5 text-sm text-muted-foreground">{toggle.description}</p>
            </div>
            <Switch
              id={toggle.key}
              checked={local[toggle.key]}
              onCheckedChange={(checked) => setLocal((previous) => ({ ...previous, [toggle.key]: checked }))}
              disabled={disabled}
            />
          </li>
        ))}
      </ul>

      <div className="space-y-2 border-t border-border pt-5">
        <Label className="text-base font-semibold">Fréquence</Label>
        <Select
          value={local.digest_frequency}
          onValueChange={(value) => setLocal((previous) => ({ ...previous, digest_frequency: value as DigestFrequency }))}
          disabled={disabled}
        >
          <SelectTrigger className="h-12 w-full text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIGEST_FREQUENCY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        Tu recevras toujours les emails liés à tes inscriptions : confirmations, billets, infos pratiques, sécurité du compte.
        Chaque email marketing contient aussi un lien de désinscription.
      </p>

      {status ? (
        <p role="status" className={status.type === 'error' ? 'text-sm text-destructive' : 'text-sm font-medium text-primary'}>
          {status.message}
        </p>
      ) : null}

      <Button onClick={save} disabled={!hasChanges || disabled} className="h-12 w-full text-base font-bold">
        {isSaving ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </div>
  )
}
