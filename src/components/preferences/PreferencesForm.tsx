'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Loader2, CheckCircle2, XCircle, Mail, Bell, Settings } from 'lucide-react'
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences'
import { NOTIFICATION_PREFERENCE_TOGGLES, DIGEST_FREQUENCY_OPTIONS } from '@/types/NotificationPreferences'
import type { DigestFrequency } from '@/types/NotificationPreferences'

interface PreferencesFormProps {
  userId: string
  userName: string
  initialPreferences: {
    marketing_opt_in: boolean
  }
}

export default function PreferencesForm({
  userId,
  userName,
  initialPreferences,
}: PreferencesFormProps) {
  const router = useRouter()
  const { preferences, isLoading: isFetchingPrefs, fetchPreferences, updatePreferences } = useNotificationPreferences()

  const [localPreferences, setLocalPreferences] = useState({
    events_announcements: false,
    price_alerts: false,
    news_blog: false,
    volunteers_opportunities: false,
    partner_offers: false,
    digest_frequency: 'immediate' as DigestFrequency,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  // Update local state when preferences are fetched
  useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        events_announcements: preferences.events_announcements,
        price_alerts: preferences.price_alerts,
        news_blog: preferences.news_blog,
        volunteers_opportunities: preferences.volunteers_opportunities,
        partner_offers: preferences.partner_offers,
        digest_frequency: preferences.digest_frequency,
      })
    }
  }, [preferences])

  const handleTogglePreference = (key: keyof typeof localPreferences, value: boolean) => {
    if (key === 'digest_frequency') return // Don't allow boolean for digest_frequency

    setLocalPreferences((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleDigestFrequencyChange = (value: DigestFrequency) => {
    setLocalPreferences((prev) => ({
      ...prev,
      digest_frequency: value,
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    setSaveStatus('idle')
    setErrorMessage('')

    try {
      const result = await updatePreferences(localPreferences)

      if (!result.success) {
        throw new Error(result.error || 'Failed to update preferences')
      }

      setSaveStatus('success')
      router.refresh()

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    } catch (error) {
      console.error('Save preferences error:', error)
      setErrorMessage(
        error instanceof Error ? error.message : 'Une erreur est survenue'
      )
      setSaveStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  const hasChanges = preferences
    ? Object.keys(localPreferences).some(
        (key) => localPreferences[key as keyof typeof localPreferences] !== preferences[key as keyof typeof preferences]
      )
    : false

  const anyMarketingEnabled =
    localPreferences.events_announcements ||
    localPreferences.price_alerts ||
    localPreferences.news_blog ||
    localPreferences.volunteers_opportunities ||
    localPreferences.partner_offers

  return (
    <div className="space-y-6">
      {/* Marketing preferences toggles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Types de communications</h3>
        </div>

        {NOTIFICATION_PREFERENCE_TOGGLES.map((toggle) => (
          <div
            key={toggle.key}
            className="flex items-start justify-between space-x-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className="flex-1 space-y-1">
              <Label
                htmlFor={toggle.key}
                className="text-base font-medium cursor-pointer"
              >
                {toggle.label}
              </Label>
              <p className="text-sm text-muted-foreground">
                {toggle.description}
              </p>
            </div>
            <Switch
              id={toggle.key}
              checked={localPreferences[toggle.key]}
              onCheckedChange={(checked) => handleTogglePreference(toggle.key, checked)}
              disabled={isLoading || isFetchingPrefs}
            />
          </div>
        ))}
      </div>

      <Separator />

      {/* Transactional emails info */}
      <div className="p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <Label className="text-base font-semibold">
            Emails transactionnels
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Vous continuerez toujours à recevoir les emails importants liés à vos inscriptions :
        </p>
        <ul className="text-sm text-muted-foreground mt-2 ml-6 list-disc space-y-1">
          <li>Confirmations d'inscription aux événements</li>
          <li>Billets et documents requis</li>
          <li>Notifications de sécurité du compte</li>
        </ul>
      </div>

      {/* Save status messages */}
      {saveStatus === 'success' && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Vos préférences ont été enregistrées avec succès !
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === 'error' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage || 'Une erreur est survenue lors de la sauvegarde.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Save button */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isLoading || isFetchingPrefs}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Enregistrer les modifications
            </>
          )}
        </Button>
      </div>

      {/* Unsubscribe all option */}
      <div className="pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">
            Vous souhaitez vous désabonner de tous les emails marketing ?
          </p>
          <p>
            Vous pouvez désactiver toutes les options ci-dessus et choisir "Jamais" comme fréquence,
            ou utiliser le lien de désabonnement présent dans chaque email que nous vous envoyons.
          </p>
        </div>
      </div>
    </div>
  )
}
