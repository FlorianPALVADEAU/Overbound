'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  adminMaintenanceQueryKey,
  updateAdminMaintenance,
  useAdminMaintenance,
} from '@/app/api/admin/maintenance/maintenanceQueries'

const toDatetimeLocal = (iso: string | null) => {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function MaintenanceSection() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useAdminMaintenance()
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const [estimatedEnd, setEstimatedEnd] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!data) return
    setEnabled(data.enabled)
    setMessage(data.message ?? '')
    setEstimatedEnd(toDatetimeLocal(data.estimated_end))
  }, [data])

  const save = async (nextEnabled: boolean) => {
    setSaving(true)
    setFeedback(null)
    try {
      const saved = await updateAdminMaintenance({
        enabled: nextEnabled,
        message: message.trim() || null,
        estimated_end: estimatedEnd ? new Date(estimatedEnd).toISOString() : null,
      })
      queryClient.setQueryData(adminMaintenanceQueryKey, saved)
      setEnabled(saved.enabled)
      setFeedback({
        type: 'success',
        text: saved.enabled ? 'Maintenance activée : le site est fermé au public.' : 'Maintenance désactivée : le site est de nouveau ouvert.',
      })
    } catch {
      setFeedback({ type: 'error', text: 'Mise à jour impossible. Réessaie.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mode maintenance</CardTitle>
        <CardDescription>
          Quand il est actif, tous les visiteurs et utilisateurs non-admin voient l&apos;écran de maintenance (pages, API et webhooks
          compris). Seules la connexion et les admins passent. Effet en moins de 10 secondes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
          <div>
            <p className="font-semibold">{enabled ? 'Site en maintenance' : 'Site ouvert au public'}</p>
            <p className="text-sm text-muted-foreground">Active ou coupe la maintenance en un clic.</p>
          </div>
          <Switch checked={enabled} disabled={isLoading || saving} onCheckedChange={(checked) => void save(checked)} aria-label="Mode maintenance" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenance-message">Message affiché (optionnel)</Label>
          <Textarea
            id="maintenance-message"
            value={message}
            maxLength={500}
            rows={3}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Laisse vide pour le message par défaut."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenance-end">Heure de retour estimée (optionnel)</Label>
          <Input id="maintenance-end" type="datetime-local" value={estimatedEnd} onChange={(event) => setEstimatedEnd(event.target.value)} />
        </div>

        <Button disabled={saving || isLoading} onClick={() => void save(enabled)}>
          Enregistrer le message
        </Button>

        {feedback ? (
          <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{feedback.text}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}
