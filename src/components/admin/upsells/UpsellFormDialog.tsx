'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
import { ArrowDown, ArrowUp, Clock, Plus, Trash2, Upload } from 'lucide-react'

export interface UpsellImageFormValue {
  url: string
  alt_text: string
}

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
  images: UpsellImageFormValue[]
  sizes: string
}

interface UpsellFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  events: Event[]
  initialValues: UpsellFormValues
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: UpsellFormValues) => void
  onUpload?: (file: File) => Promise<void>
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
  images: [],
  sizes: '',
}

export function UpsellFormDialog({
  open,
  mode,
  events,
  initialValues,
  loading,
  onOpenChange,
  onSubmit,
  onUpload,
}: UpsellFormDialogProps) {
  const [values, setValues] = useState<UpsellFormValues>(DEFAULT_VALUES)
  const isCreateMode = mode === 'create'
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

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
    setValues((prev) => {
      if (field === 'type') {
        const nextType = value as Upsell['type']
        const nextValues = { ...prev, type: nextType }
        if (nextType === 'tshirt' && (!prev.sizes || prev.sizes.trim().length === 0)) {
          nextValues.sizes = 'XS,S,M,L,XL,XXL'
        }
        if (nextType !== 'tshirt') {
          nextValues.sizes = ''
        }
        return nextValues
      }

      if (field === 'sizes') {
        return { ...prev, sizes: String(value) }
      }

      return { ...prev, [field]: value }
    })
  }
  const handleSubmit = () => {
    const images = values.images
      .map((image) => ({ ...image, url: image.url.trim(), alt_text: image.alt_text.trim() }))
      .filter((image) => image.url.length > 0)

    if (images.some((image) => !image.url.startsWith('https://'))) {
      return
    }

    onSubmit({ ...values, images })
  }

  const handleUpload = async (file: File | undefined) => {
    if (!file || !onUpload) return
    setUploading(true)
    try { await onUpload(file) } finally { setUploading(false); if (uploadInputRef.current) uploadInputRef.current.value = '' }
  }

  const updateImage = (index: number, field: keyof UpsellImageFormValue, value: string) => {
    setValues((previous) => ({
      ...previous,
      images: previous.images.map((image, imageIndex) =>
        imageIndex === index ? { ...image, [field]: value } : image
      ),
    }))
  }

  const moveImage = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= values.images.length) return

    setValues((previous) => {
      const images = [...previous.images]
      ;[images[index], images[nextIndex]] = [images[nextIndex], images[index]]
      return { ...previous, images }
    })
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
                  <SelectItem value="patch">Patch adhésif</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {values.type === 'tshirt' ? (
            <div className="space-y-2">
              <Label htmlFor="upsell-sizes">Tailles disponibles</Label>
              <Input
                id="upsell-sizes"
                value={values.sizes}
                onChange={(event) => handleChange('sizes', event.target.value)}
                placeholder="Ex: XS,S,M,L,XL,XXL"
              />
              <p className="text-xs text-muted-foreground">
                Entrez les tailles séparées par une virgule. L'ordre sera conservé dans l'interface.
              </p>
            </div>
          ) : null}

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

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <Label>Images</Label>
                <p className="text-xs text-muted-foreground">Jusqu’à 10 URLs HTTPS. La première image est la couverture.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValues((previous) => ({ ...previous, images: [...previous.images, { url: '', alt_text: '' }] }))}
                disabled={values.images.length >= 10}
              >
                <Plus className="mr-1 h-4 w-4" />
                Ajouter
              </Button>
              {!isCreateMode && onUpload ? <>
                <input ref={uploadInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => void handleUpload(event.target.files?.[0])} />
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => uploadInputRef.current?.click()}>
                  <Upload className="mr-1 h-4 w-4" />{uploading ? 'Envoi…' : 'Téléverser'}
                </Button>
              </> : null}
            </div>

            {values.images.map((image, index) => (
              <div key={`${index}-${image.url}`} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Image {index + 1}</span>
                  <div className="ml-auto flex gap-1">
                    <Button type="button" variant="ghost" size="icon" aria-label="Monter l'image" onClick={() => moveImage(index, -1)} disabled={index === 0}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" aria-label="Descendre l'image" onClick={() => moveImage(index, 1)} disabled={index === values.images.length - 1}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" aria-label="Supprimer l'image" onClick={() => setValues((previous) => ({ ...previous, images: previous.images.filter((_, imageIndex) => imageIndex !== index) }))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Input
                  value={image.url}
                  type="url"
                  inputMode="url"
                  onChange={(event) => updateImage(index, 'url', event.target.value)}
                  placeholder="https://..."
                  aria-label={`URL de l'image ${index + 1}`}
                />
                <Input
                  value={image.alt_text}
                  onChange={(event) => updateImage(index, 'alt_text', event.target.value)}
                  placeholder="Texte alternatif (facultatif)"
                  aria-label={`Texte alternatif de l'image ${index + 1}`}
                />
                {image.url && !image.url.startsWith('https://') ? (
                  <p className="text-xs text-destructive">Utilisez une URL HTTPS.</p>
                ) : null}
              </div>
            ))}

            {values.images.length === 0 ? (
              <div className="space-y-2">
                <Label htmlFor="upsell-image">Image (URL, compatibilité)</Label>
                <Input
                  id="upsell-image"
                  value={values.image_url}
                  type="url"
                  onChange={(event) => handleChange('image_url', event.target.value)}
                  placeholder="https://..."
                />
              </div>
            ) : null}
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
