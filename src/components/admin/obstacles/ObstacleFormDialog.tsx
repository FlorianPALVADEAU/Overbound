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
import type { Obstacle } from '@/types/Obstacle'
import { Clock } from 'lucide-react'

export interface ObstacleFormValues {
  name: string
  description: string
  image_url: string
  video_url: string
  difficulty: string
  type: Obstacle['type']
  metric_label: string
  metric_value: string
  weight_male: string
  weight_female: string
  penalty: string
}

interface ObstacleFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initialValues: ObstacleFormValues
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ObstacleFormValues) => void
}

const DEFAULT_VALUES: ObstacleFormValues = {
  name: '',
  description: '',
  image_url: '',
  video_url: '',
  difficulty: '5',
  type: 'force',
  metric_label: '',
  metric_value: '',
  weight_male: '',
  weight_female: '',
  penalty: '',
}

export function ObstacleFormDialog({
  open,
  mode,
  initialValues,
  loading,
  onOpenChange,
  onSubmit,
}: ObstacleFormDialogProps) {
  const [values, setValues] = useState<ObstacleFormValues>(DEFAULT_VALUES)
  const isCreateMode = mode === 'create'

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const dialogTitle = useMemo(
    () => (isCreateMode ? 'Créer un obstacle' : "Modifier l'obstacle"),
    [isCreateMode]
  )
  const dialogDescription = useMemo(
    () =>
      isCreateMode
        ? 'Ajoutez un obstacle pour vos courses.'
        : "Modifiez les informations de cet obstacle.",
    [isCreateMode]
  )

  const handleChange = (field: keyof ObstacleFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="obstacle-name">Nom *</Label>
            <Input
              id="obstacle-name"
              value={values.name}
              onChange={(event) => handleChange('name', event.target.value)}
              placeholder="Ex: Passe-muraille"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="obstacle-description">Description</Label>
            <Textarea
              id="obstacle-description"
              value={values.description}
              onChange={(event) => handleChange('description', event.target.value)}
              placeholder="Description détaillée de l'obstacle"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="obstacle-image">Image (URL)</Label>
              <Input
                id="obstacle-image"
                value={values.image_url}
                onChange={(event) => handleChange('image_url', event.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obstacle-video">Vidéo (URL)</Label>
              <Input
                id="obstacle-video"
                value={values.video_url}
                onChange={(event) => handleChange('video_url', event.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="obstacle-difficulty">Difficulté (1-10) *</Label>
              <Input
                id="obstacle-difficulty"
                type="number"
                min="1"
                max="10"
                value={values.difficulty}
                onChange={(event) => handleChange('difficulty', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obstacle-type">Type *</Label>
              <Select value={values.type} onValueChange={(value) => handleChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="force">Force</SelectItem>
                  <SelectItem value="agilité">Agilité</SelectItem>
                  <SelectItem value="endurance">Endurance</SelectItem>
                  <SelectItem value="technique">Technique</SelectItem>
                  <SelectItem value="mental">Mental</SelectItem>
                  <SelectItem value="équilibre">Équilibre</SelectItem>
                  <SelectItem value="vitesse">Vitesse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <h3 className="font-medium">Indication de l&apos;obstacle (optionnel)</h3>
              <p className="text-sm text-muted-foreground">
                Ce qui caractérise l&apos;obstacle si applicable : distance, hauteur, largeur…
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="obstacle-metric-label">Libellé</Label>
                <Input
                  id="obstacle-metric-label"
                  value={values.metric_label}
                  onChange={(event) => handleChange('metric_label', event.target.value)}
                  placeholder="Ex: Distance, Hauteur…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="obstacle-metric-value">Valeur</Label>
                <Input
                  id="obstacle-metric-value"
                  value={values.metric_value}
                  onChange={(event) => handleChange('metric_value', event.target.value)}
                  placeholder="Ex: 50m, 2,20m…"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <h3 className="font-medium">Charge à porter (optionnel)</h3>
              <p className="text-sm text-muted-foreground">
                Même charge quel que soit le format (OPEN ou RANKED).
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="obstacle-weight-male">Poids homme</Label>
                <Input
                  id="obstacle-weight-male"
                  value={values.weight_male}
                  onChange={(event) => handleChange('weight_male', event.target.value)}
                  placeholder="Ex: 20kg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="obstacle-weight-female">Poids femme</Label>
                <Input
                  id="obstacle-weight-female"
                  value={values.weight_female}
                  onChange={(event) => handleChange('weight_female', event.target.value)}
                  placeholder="Ex: 15kg"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="obstacle-penalty">Pénalité (optionnel)</Label>
            <Textarea
              id="obstacle-penalty"
              value={values.penalty}
              onChange={(event) => handleChange('penalty', event.target.value)}
              placeholder="Pénalité en cas d'échec ou de contournement de l'obstacle"
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

ObstacleFormDialog.defaultProps = {
  loading: false,
}
