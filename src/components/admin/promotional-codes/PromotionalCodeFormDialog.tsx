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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { Event } from '@/types/Event'
import type { PromotionalCode } from '@/types/PromotionalCode'
import { Clock } from 'lucide-react'

export interface PromotionalCodeFormValues {
  code: string
  name: string
  description: string
  discountType: 'percent' | 'amount'
  discountValue: string
  currency: PromotionalCode['currency']
  valid_from: string
  valid_until: string
  usage_limit: string
  is_active: boolean
  event_ids: string[]
}

interface PromotionalCodeFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  events: Event[]
  initialValues: PromotionalCodeFormValues
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PromotionalCodeFormValues) => void
}

const DEFAULT_VALUES: PromotionalCodeFormValues = {
  code: '',
  name: '',
  description: '',
  discountType: 'percent',
  discountValue: '10',
  currency: 'eur',
  valid_from: '',
  valid_until: '',
  usage_limit: '',
  is_active: true,
  event_ids: [],
}

export function PromotionalCodeFormDialog({
  open,
  mode,
  events,
  initialValues,
  loading,
  onOpenChange,
  onSubmit,
}: PromotionalCodeFormDialogProps) {
  const [values, setValues] = useState<PromotionalCodeFormValues>(DEFAULT_VALUES)
  const isCreateMode = mode === 'create'

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const dialogTitle = useMemo(
    () => (isCreateMode ? 'Créer un code promotionnel' : 'Modifier le code promotionnel'),
    [isCreateMode]
  )

  const dialogDescription = useMemo(
    () =>
      isCreateMode
        ? 'Définissez les conditions de votre code promotionnel.'
        : 'Mettez à jour les informations de ce code promotionnel.',
    [isCreateMode]
  )

  const handleChange = (field: keyof PromotionalCodeFormValues, value: string | string[] | boolean) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="promo-code">Code *</Label>
              <Input
                id="promo-code"
                value={values.code}
                onChange={(event) => handleChange('code', event.target.value.toUpperCase())}
                placeholder="EARLY2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo-name">Nom *</Label>
              <Input
                id="promo-name"
                value={values.name}
                onChange={(event) => handleChange('name', event.target.value)}
                placeholder="Early Bird 2024"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promo-description">Description</Label>
            <Textarea
              id="promo-description"
              value={values.description}
              onChange={(event) => handleChange('description', event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type de remise</Label>
              <Select
                value={values.discountType}
                onValueChange={(value) => handleChange('discountType', value as PromotionalCodeFormValues['discountType'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Pourcentage</SelectItem>
                  <SelectItem value="amount">Montant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valeur *</Label>
              <Input
                type="number"
                min="0"
                value={values.discountValue}
                onChange={(event) => handleChange('discountValue', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Devise</Label>
              <Select value={values.currency} onValueChange={(value) => handleChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eur">EUR (€)</SelectItem>
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="gbp">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valide du *</Label>
              <Input
                type="datetime-local"
                value={values.valid_from}
                onChange={(event) => handleChange('valid_from', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Valide jusqu'au *</Label>
              <Input
                type="datetime-local"
                value={values.valid_until}
                onChange={(event) => handleChange('valid_until', event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Limite d'utilisation</Label>
              <Input
                type="number"
                min="0"
                value={values.usage_limit}
                onChange={(event) => handleChange('usage_limit', event.target.value)}
                placeholder="Illimité"
              />
            </div>
            <div className="flex items-center justify-between border rounded-lg p-4">
              <div>
                <Label htmlFor="promo-active" className="font-medium">
                  Code actif
                </Label>
                <p className="text-sm text-muted-foreground">Activer ou désactiver le code.</p>
              </div>
              <Switch
                id="promo-active"
                checked={values.is_active}
                onCheckedChange={(checked) => handleChange('is_active', Boolean(checked))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Événements associés</Label>
            <p className="text-sm text-muted-foreground">
              Sélectionnez les événements sur lesquels le code est applicable.
            </p>
            <div className="grid md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
              {events.map((event) => (
                <label
                  key={event.id}
                  htmlFor={`event-${event.id}`}
                  className="flex items-center space-x-2 rounded border p-3 hover:bg-muted/50"
                >
                  <Checkbox
                    id={`event-${event.id}`}
                    checked={values.event_ids.includes(event.id)}
                    onCheckedChange={() => {
                      setValues((prev) => ({
                        ...prev,
                        event_ids: prev.event_ids.includes(event.id)
                          ? prev.event_ids.filter((entry) => entry !== event.id)
                          : [...prev.event_ids, event.id],
                      }))
                    }}
                  />
                  <span className="text-sm">{event.title}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                {isCreateMode ? 'Création...' : 'Mise à jour...'}
              </>
            ) : (
              isCreateMode ? 'Créer' : 'Mettre à jour'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

PromotionalCodeFormDialog.defaultProps = {
  loading: false,
}
