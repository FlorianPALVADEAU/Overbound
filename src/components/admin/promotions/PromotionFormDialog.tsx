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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

export interface PromotionFormValues {
  title: string
  description: string
  link_url: string
  link_text: string
  starts_at: string
  ends_at: string
  is_active: boolean
}

interface PromotionFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initialValues: PromotionFormValues
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PromotionFormValues) => void
}

const DEFAULT_VALUES: PromotionFormValues = {
  title: '',
  description: '',
  link_url: '',
  link_text: "Découvrir l'offre",
  starts_at: '',
  ends_at: '',
  is_active: true,
}

export function PromotionFormDialog({
  open,
  mode,
  initialValues,
  loading = false,
  onOpenChange,
  onSubmit,
}: PromotionFormDialogProps) {
  const [values, setValues] = useState<PromotionFormValues>(DEFAULT_VALUES)
  const isCreateMode = mode === 'create'

  const dialogTitle = useMemo(
    () => (isCreateMode ? 'Créer une promotion' : 'Modifier la promotion'),
    [isCreateMode],
  )

  const dialogDescription = useMemo(
    () =>
      isCreateMode
        ? 'Ajoutez un nouveau bandeau promotionnel visible sur le site.'
        : 'Mettez à jour cette promotion.',
    [isCreateMode],
  )

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const handleChange = (field: keyof PromotionFormValues, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promotion-title">Titre *</Label>
            <Input
              id="promotion-title"
              value={values.title}
              onChange={(event) => handleChange('title', event.target.value)}
              placeholder="Nom de l’offre"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promotion-description">Description *</Label>
            <Textarea
              id="promotion-description"
              value={values.description}
              onChange={(event) => handleChange('description', event.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promotion-link">Lien *</Label>
            <Input
              id="promotion-link"
              value={values.link_url}
              onChange={(event) => handleChange('link_url', event.target.value)}
              placeholder="https://overbound.fr/offre"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promotion-link-text">Texte du lien *</Label>
            <Input
              id="promotion-link-text"
              value={values.link_text}
              onChange={(event) => handleChange('link_text', event.target.value)}
              placeholder="Découvrir l'offre"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="promotion-starts">Début *</Label>
              <Input
                id="promotion-starts"
                type="datetime-local"
                value={values.starts_at}
                onChange={(event) => handleChange('starts_at', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promotion-ends">Fin *</Label>
              <Input
                id="promotion-ends"
                type="datetime-local"
                value={values.ends_at}
                onChange={(event) => handleChange('ends_at', event.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Promotion active</p>
              <p className="text-xs text-muted-foreground">
                Les promotions inactives ne seront pas affichées publiquement.
              </p>
            </div>
            <Switch
              checked={values.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
