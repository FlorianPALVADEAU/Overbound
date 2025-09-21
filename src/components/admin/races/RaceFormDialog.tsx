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
import { Checkbox } from '@/components/ui/checkbox'
import type { Race } from '@/types/Race'
import type { Obstacle } from '@/types/Obstacle'
import { Clock } from 'lucide-react'

export interface RaceFormValues {
  name: string
  logo_url: string
  type: Race['type']
  difficulty: string
  target_public: Race['target_public']
  distance_km: string
  description: string
  obstacle_ids: string[]
}

interface RaceFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  obstacles: Obstacle[]
  initialValues: RaceFormValues
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: RaceFormValues) => void
}

const DEFAULT_VALUES: RaceFormValues = {
  name: '',
  logo_url: '',
  type: 'trail',
  difficulty: '5',
  target_public: 'intermédiaire',
  distance_km: '10',
  description: '',
  obstacle_ids: [],
}

function difficultyBadgeColor(difficulty: number) {
  if (difficulty >= 8) return 'bg-red-100 text-red-800'
  if (difficulty >= 5) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

export function RaceFormDialog({
  open,
  mode,
  obstacles,
  initialValues,
  loading,
  onOpenChange,
  onSubmit,
}: RaceFormDialogProps) {
  const [values, setValues] = useState<RaceFormValues>(DEFAULT_VALUES)
  const isCreateMode = mode === 'create'

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const dialogTitle = useMemo(() => (isCreateMode ? 'Créer une course' : 'Modifier la course'), [isCreateMode])
  const dialogDescription = useMemo(
    () =>
      isCreateMode
        ? 'Créez un nouveau format de course et sélectionnez ses obstacles.'
        : 'Modifiez les informations de cette course.',
    [isCreateMode]
  )

  const handleChange = (field: keyof RaceFormValues, value: string | string[]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const toggleObstacle = (obstacleId: string) => {
    setValues((prev) => ({
      ...prev,
      obstacle_ids: prev.obstacle_ids.includes(obstacleId)
        ? prev.obstacle_ids.filter((id) => id !== obstacleId)
        : [...prev.obstacle_ids, obstacleId],
    }))
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
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(event) => handleChange('name', event.target.value)}
              placeholder="Ex: Elite 12km Obstacles"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo (URL)</Label>
            <Input
              id="logo_url"
              value={values.logo_url}
              onChange={(event) => handleChange('logo_url', event.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={values.type} onValueChange={(value) => handleChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trail">Trail</SelectItem>
                  <SelectItem value="obstacle">Course d'obstacles</SelectItem>
                  <SelectItem value="urbain">Course urbaine</SelectItem>
                  <SelectItem value="nature">Course nature</SelectItem>
                  <SelectItem value="extreme">Course extrême</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_public">Public cible *</Label>
              <Select
                value={values.target_public}
                onValueChange={(value) => handleChange('target_public', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="débutant">Débutant</SelectItem>
                  <SelectItem value="intermédiaire">Intermédiaire</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                  <SelectItem value="famille">Famille</SelectItem>
                  <SelectItem value="pro">Professionnel</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulté (1-10) *</Label>
              <Input
                id="difficulty"
                type="number"
                min="1"
                max="10"
                value={values.difficulty}
                onChange={(event) => handleChange('difficulty', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="distance_km">Distance (km) *</Label>
              <Input
                id="distance_km"
                type="number"
                step="0.5"
                min="0"
                value={values.distance_km}
                onChange={(event) => handleChange('distance_km', event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(event) => handleChange('description', event.target.value)}
              placeholder="Description détaillée de la course"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Sélection des obstacles</h4>
                <p className="text-sm text-muted-foreground">
                  Choisissez les obstacles qui composent cette course.
                </p>
              </div>
              <span className="text-sm text-muted-foreground">
                {values.obstacle_ids.length} obstacle(s) sélectionné(s)
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
              {obstacles.map((obstacle) => (
                <label
                  htmlFor={`obstacle-${obstacle.id}`}
                  key={obstacle.id}
                  className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50"
                >
                  <Checkbox
                    id={`obstacle-${obstacle.id}`}
                    checked={values.obstacle_ids.includes(obstacle.id)}
                    onCheckedChange={() => toggleObstacle(obstacle.id)}
                  />
                  <div className="space-y-1">
                    <div className="font-medium leading-none">{obstacle.name}</div>
                    {obstacle.description && (
                      <p className="text-xs text-muted-foreground">{obstacle.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`px-2 py-1 rounded ${difficultyBadgeColor(obstacle.difficulty)}`}>
                        {obstacle.difficulty}/10
                      </span>
                      <span className="px-2 py-1 rounded bg-muted">{obstacle.type}</span>
                    </div>
                  </div>
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

RaceFormDialog.defaultProps = {
  loading: false,
}
