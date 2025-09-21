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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { Event } from '@/types/Event'
import type { Upsell } from '@/types/Upsell'
import { Clock } from 'lucide-react'

export interface UpsellFormValues {
  name: string
  description: string
  price_cents: string
  currency: Upsell['currency']
  type: Upsell['type']
  event_id: string
  is_active: boolean
  stock_quantity: string
  image_url: string
}

interface UpsellFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  events: Event[]
  initialValues: UpsellFormValues
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: UpsellFormValues) => void
}

const DEFAULT_VALUES: UpsellFormValues = {
  name: '',
  description: '',
  price_cents: '0',
  currency: 'eur',
  type: 'other',
  event_id: 'none',
  is_active: true,
  stock_quantity: '',
  image_url: '',
}

export function UpsellFormDialog({
  open,
  mode,
  events,
  initialValues,
  loading,
  onOpenChange,
  onSubmit,
}: UpsellFormDialogProps) {
  const [values, setValues] = useState<UpsellFormValues>(DEFAULT_VALUES)
  const isCreateMode = mode === 'create'

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const dialogTitle = useMemo(() => (isCreateMode ? 'Créer un upsell' : 'Modifier l\'upsell'), [isCreateMode])
  const dialogDescription = useMemo(
    () =>
      isCreateMode
        ? 'Ajoutez un produit ou service complémentaire.'
        : 'Mettez à jour les informations de cet upsell.',
    [isCreateMode]
  )

  const handleChange = (field: keyof UpsellFormValues, value: string | boolean) => {
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
          <div className="space-y-2">
            <Label htmlFor="upsell-name">Nom *</Label>
            <Input
              id="upsell-name"
              value={values.name}
              onChange={(event) => handleChange('name', event.target.value)}
              placeholder="T-shirt officiel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upsell-description">Description</Label>
            <Textarea
              id="upsell-description"
              value={values.description}
              onChange={(event) => handleChange('description', event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="upsell-price">Prix (centimes) *</Label>
              <Input
                id="upsell-price"
                type="number"
                min="0"
                value={values.price_cents}
                onChange={(event) => handleChange('price_cents', event.target.value)}
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
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={values.type} onValueChange={(value) => handleChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tshirt">T-shirt</SelectItem>
                  <SelectItem value="photos">Photos</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Événement associé</Label>
              <Select value={values.event_id} onValueChange={(value) => handleChange('event_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="upsell-stock">Stock</Label>
              <Input
                id="upsell-stock"
                type="number"
                min="0"
                value={values.stock_quantity}
                onChange={(event) => handleChange('stock_quantity', event.target.value)}
                placeholder="Illimité"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="upsell-image">Image (URL)</Label>
            <Input
              id="upsell-image"
              value={values.image_url}
              onChange={(event) => handleChange('image_url', event.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center justify-between border rounded-lg p-4">
            <div>
              <Label htmlFor="upsell-active" className="font-medium">
                Upsell actif
              </Label>
              <p className="text-sm text-muted-foreground">Activez ou désactivez la vente de cet upsell.</p>
            </div>
            <Switch
              id="upsell-active"
              checked={values.is_active}
              onCheckedChange={(checked) => handleChange('is_active', Boolean(checked))}
            />
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

UpsellFormDialog.defaultProps = {
  loading: false,
}
