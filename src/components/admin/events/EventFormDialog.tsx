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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Event } from '@/types/Event'
import type { EventPriceTier } from '@/types/EventPriceTier'
import { EventPriceTierManager } from './EventPriceTierManager'
import { Clock } from 'lucide-react'

export interface EventFormValues {
  slug: string
  title: string
  subtitle: string
  description: string
  date: string
  location: string
  latitude: string
  longitude: string
  capacity: string
  status: Event['status']
  external_provider: string
  external_event_id: string
  external_url: string
}

export interface EventFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initialValues: EventFormValues
  loading?: boolean
  eventId?: string
  priceTiers?: EventPriceTier[]
  onOpenChange: (open: boolean) => void
  onSubmit: (values: EventFormValues) => void
  onPriceTiersChange?: (tiers: EventPriceTier[]) => void
}

const DEFAULT_VALUES: EventFormValues = {
  slug: '',
  title: '',
  subtitle: '',
  description: '',
  date: '',
  location: '',
  latitude: '',
  longitude: '',
  capacity: '0',
  status: 'draft',
  external_provider: 'none',
  external_event_id: '',
  external_url: '',
}

function generateSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function EventFormDialog({
  open,
  mode,
  initialValues,
  loading,
  eventId,
  priceTiers = [],
  onOpenChange,
  onSubmit,
  onPriceTiersChange,
}: EventFormDialogProps) {
  const [values, setValues] = useState<EventFormValues>(DEFAULT_VALUES)
  const [localPriceTiers, setLocalPriceTiers] = useState<EventPriceTier[]>(priceTiers)
  const isCreateMode = mode === 'create'

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  useEffect(() => {
    setLocalPriceTiers(priceTiers)
  }, [priceTiers])

  const dialogTitle = useMemo(() => (isCreateMode ? 'Créer un événement' : "Modifier l'événement"), [isCreateMode])
  const dialogDescription = useMemo(
    () =>
      isCreateMode
        ? 'Créez un nouvel événement sportif avec tous les détails nécessaires.'
        : 'Modifiez les informations de cet événement.',
    [isCreateMode]
  )

  const handleChange = (field: keyof EventFormValues, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'title' && !initialValues.slug) {
        next.slug = generateSlug(value)
      }
      return next
    })
  }

  const handleSubmit = () => {
    onSubmit(values)
  }

  const handlePriceTiersChange = (newTiers: EventPriceTier[]) => {
    setLocalPriceTiers(newTiers)
    onPriceTiersChange?.(newTiers)
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
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(event) => handleChange('title', event.target.value)}
              placeholder="Ex: Trail des Collines 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug URL *</Label>
            <Input
              id="slug"
              value={values.slug}
              onChange={(event) => handleChange('slug', event.target.value)}
              placeholder="trail-des-collines-2024"
            />
            <p className="text-xs text-muted-foreground">Généré automatiquement depuis le titre. Utilisé dans l'URL.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Sous-titre</Label>
            <Input
              id="subtitle"
              value={values.subtitle}
              onChange={(event) => handleChange('subtitle', event.target.value)}
              placeholder="Course nature en forêt"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(event) => handleChange('description', event.target.value)}
              placeholder="Description détaillée de l'événement"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date et heure *</Label>
            <Input
              id="date"
              type="datetime-local"
              value={values.date}
              onChange={(event) => handleChange('date', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Lieu *</Label>
            <Input
              id="location"
              value={values.location}
              onChange={(event) => handleChange('location', event.target.value)}
              placeholder="Forêt de Fontainebleau, 77300 Fontainebleau"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={values.latitude}
                onChange={(event) => handleChange('latitude', event.target.value)}
                placeholder="48.8566"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={values.longitude}
                onChange={(event) => handleChange('longitude', event.target.value)}
                placeholder="2.3522"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacité *</Label>
              <Input
                id="capacity"
                type="number"
                min="0"
                value={values.capacity}
                onChange={(event) => handleChange('capacity', event.target.value)}
                placeholder="200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={values.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="on_sale">En vente</SelectItem>
                  <SelectItem value="sold_out">Complet</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isCreateMode && eventId && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium text-lg">Paliers de prix</h4>
              <p className="text-sm text-muted-foreground">
                Définissez les réductions en pourcentage qui s'appliqueront à tous les tickets de cet événement.
              </p>
              <EventPriceTierManager
                eventId={eventId}
                tiers={localPriceTiers}
                onTiersChange={handlePriceTiersChange}
              />
            </div>
          )}

          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium">Prestataire externe (optionnel)</h4>

            <div className="space-y-2">
              <Label htmlFor="external_provider">Prestataire</Label>
              <Select
                value={values.external_provider}
                onValueChange={(value) => handleChange('external_provider', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  <SelectItem value="billetweb">Billetweb</SelectItem>
                  <SelectItem value="adeorun">Adeorun</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {values.external_provider !== 'none' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="external_event_id">ID événement externe</Label>
                  <Input
                    id="external_event_id"
                    value={values.external_event_id}
                    onChange={(event) => handleChange('external_event_id', event.target.value)}
                    placeholder="ID de l'événement chez le prestataire"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="external_url">URL externe</Label>
                  <Input
                    id="external_url"
                    type="url"
                    value={values.external_url}
                    onChange={(event) => handleChange('external_url', event.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </>
            )}
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

EventFormDialog.defaultProps = {
  loading: false,
}

EventFormDialog.displayName = 'EventFormDialog'
