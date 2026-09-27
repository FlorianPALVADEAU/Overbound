'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AdminEventSummary } from '@/app/api/admin/events/eventsQueries'
import type { LuckyWheelCampaignPayload, LuckyWheelCommercialPhase } from '@/app/api/admin/lucky-wheel/luckyWheelQueries'

export interface CampaignFormValues {
  name: string
  enabled: boolean
  paused: boolean
  starts_at: string
  ends_at: string
  commercial_phase: LuckyWheelCommercialPhase
  reward_expiration_hours: string
  max_discount_budget: string
  event_ids: string[]
  trigger_delay_seconds: string
}

interface CampaignFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  events: AdminEventSummary[]
  initialValues: CampaignFormValues
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: LuckyWheelCampaignPayload) => void
}

export const DEFAULT_CAMPAIGN_FORM_VALUES: CampaignFormValues = {
  name: '',
  enabled: false,
  paused: false,
  starts_at: '',
  ends_at: '',
  commercial_phase: 'STANDARD',
  reward_expiration_hours: '48',
  max_discount_budget: '',
  event_ids: [],
  // FDR-0014 §3.1: without at least one trigger rule, the widget never
  // opens on its own (use-lucky-wheel-trigger.ts creates no timer/listener
  // for an empty {} ruleset). 5s is a safe default so a newly created
  // campaign is testable immediately, not silently inert.
  trigger_delay_seconds: '5',
}

// FDR-0014 §10/§12: campaign config form. Multi-event (Q-1) via a checkbox
// list, same pattern as PromotionalCodeFormDialog's event_ids.
export function CampaignFormDialog({
  open,
  mode,
  events,
  initialValues,
  loading,
  onOpenChange,
  onSubmit,
}: CampaignFormDialogProps) {
  const [values, setValues] = useState<CampaignFormValues>(DEFAULT_CAMPAIGN_FORM_VALUES)
  const [error, setError] = useState<string | null>(null)
  const isCreateMode = mode === 'create'

  useEffect(() => {
    setValues(initialValues)
    setError(null)
  }, [initialValues, open])

  const dialogTitle = useMemo(
    () => (isCreateMode ? 'Créer une campagne Lucky Wheel' : 'Modifier la campagne'),
    [isCreateMode],
  )

  const handleChange = <K extends keyof CampaignFormValues>(field: K, value: CampaignFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const toggleEvent = (eventId: string) => {
    setValues((prev) => ({
      ...prev,
      event_ids: prev.event_ids.includes(eventId)
        ? prev.event_ids.filter((id) => id !== eventId)
        : [...prev.event_ids, eventId],
    }))
  }

  const handleSubmit = () => {
    if (!values.name.trim()) {
      setError('Le nom est requis')
      return
    }
    if (!values.starts_at || !values.ends_at) {
      setError('Les dates de début et de fin sont requises')
      return
    }
    if (new Date(values.starts_at) >= new Date(values.ends_at)) {
      setError('La date de fin doit être après la date de début')
      return
    }
    if (values.event_ids.length === 0) {
      setError('Sélectionnez au moins un événement')
      return
    }

    const rewardExpirationHours = parseInt(values.reward_expiration_hours, 10)
    if (Number.isNaN(rewardExpirationHours) || rewardExpirationHours <= 0) {
      setError('La durée de validité des récompenses doit être un nombre positif')
      return
    }

    const trimmedBudget = values.max_discount_budget.trim()
    const maxDiscountBudget = trimmedBudget ? Number(trimmedBudget) : null
    if (trimmedBudget && (Number.isNaN(maxDiscountBudget) || (maxDiscountBudget ?? 0) < 0)) {
      setError('Le budget maximum doit être un nombre positif')
      return
    }

    const triggerDelaySeconds = parseInt(values.trigger_delay_seconds, 10)
    if (Number.isNaN(triggerDelaySeconds) || triggerDelaySeconds < 0) {
      setError("Le délai avant affichage doit être un nombre positif ou nul")
      return
    }

    setError(null)
    onSubmit({
      name: values.name.trim(),
      enabled: values.enabled,
      paused: values.paused,
      starts_at: new Date(values.starts_at).toISOString(),
      ends_at: new Date(values.ends_at).toISOString(),
      commercial_phase: values.commercial_phase,
      reward_expiration_hours: rewardExpirationHours,
      max_discount_budget: maxDiscountBudget,
      event_ids: values.event_ids,
      // FDR-0014 §3.1: only delay_ms is admin-configurable for now
      // (scroll_percent/exit_intent remain supported by
      // use-lucky-wheel-trigger.ts but have no form field yet).
      trigger_rules: { delay_ms: triggerDelaySeconds * 1000 },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Une campagne Lucky Wheel peut cibler plusieurs événements. Le tirage reste toujours
            déterminé côté serveur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Nom *</Label>
            <Input
              id="campaign-name"
              value={values.name}
              onChange={(event) => handleChange('name', event.target.value)}
              placeholder="Lancement Ultra Arena"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-starts">Début *</Label>
              <Input
                id="campaign-starts"
                type="datetime-local"
                value={values.starts_at}
                onChange={(event) => handleChange('starts_at', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-ends">Fin *</Label>
              <Input
                id="campaign-ends"
                type="datetime-local"
                value={values.ends_at}
                onChange={(event) => handleChange('ends_at', event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Phase commerciale</Label>
              <Select
                value={values.commercial_phase}
                onValueChange={(value) => handleChange('commercial_phase', value as LuckyWheelCommercialPhase)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LAUNCH">Lancement</SelectItem>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="HIGH_DEMAND">Forte demande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-expiration">Validité récompense (heures)</Label>
              <Input
                id="campaign-expiration"
                type="number"
                min={1}
                value={values.reward_expiration_hours}
                onChange={(event) => handleChange('reward_expiration_hours', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-budget">Budget max (optionnel)</Label>
              <Input
                id="campaign-budget"
                type="number"
                min={0}
                value={values.max_discount_budget}
                onChange={(event) => handleChange('max_discount_budget', event.target.value)}
                placeholder="Illimité"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-trigger-delay">Délai avant affichage (secondes) *</Label>
            <Input
              id="campaign-trigger-delay"
              type="number"
              min={0}
              value={values.trigger_delay_seconds}
              onChange={(event) => handleChange('trigger_delay_seconds', event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Sans délai configuré, la roue ne s'affiche jamais automatiquement sur la page événement.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="campaign-enabled"
                checked={values.enabled}
                onCheckedChange={(checked) => handleChange('enabled', checked)}
              />
              <Label htmlFor="campaign-enabled">Activée</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Événements ciblés *</Label>
            <div className="max-h-48 overflow-y-auto rounded-md border p-3 space-y-2">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun événement disponible.</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`campaign-event-${event.id}`}
                      checked={values.event_ids.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                    />
                    <Label htmlFor={`campaign-event-${event.id}`} className="font-normal">
                      {event.title}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Enregistrement…' : isCreateMode ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
