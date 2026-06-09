'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Bootcamp, BootcampFormValues } from '@/types/Bootcamp'

interface BootcampFormDialogProps {
  open: boolean
  bootcamp?: Bootcamp | null
  onClose: () => void
  onSubmit: (values: BootcampFormValues) => Promise<void>
}

const empty: BootcampFormValues = {
  title: '',
  description: null,
  image_url: null,
  location_name: '',
  location_address: null,
  lat: null,
  lng: null,
  starts_at: '',
}

function toFormValues(b: Bootcamp): BootcampFormValues {
  return {
    title: b.title,
    description: b.description ?? null,
    image_url: b.image_url ?? null,
    location_name: b.location_name,
    location_address: b.location_address ?? null,
    lat: b.lat ?? null,
    lng: b.lng ?? null,
    starts_at: b.starts_at,
  }
}

export function BootcampFormDialog({ open, bootcamp, onClose, onSubmit }: BootcampFormDialogProps) {
  const [form, setForm] = useState<BootcampFormValues>(empty)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(bootcamp ? toFormValues(bootcamp) : empty)
    setError(null)
  }, [bootcamp, open])

  const set = (field: keyof BootcampFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value || null }))

  const setNum = (field: 'lat' | 'lng') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setForm((prev) => ({ ...prev, [field]: isNaN(val) ? null : val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await onSubmit(form)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bootcamp ? 'Modifier le bootcamp' : 'Créer un bootcamp'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bc-title">Titre *</Label>
            <Input id="bc-title" value={form.title} onChange={set('title')} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bc-desc">Description</Label>
            <Textarea
              id="bc-desc"
              rows={3}
              value={form.description ?? ''}
              onChange={set('description')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bc-img">URL de l'image</Label>
            <Input
              id="bc-img"
              type="url"
              placeholder="https://..."
              value={form.image_url ?? ''}
              onChange={set('image_url')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bc-starts">Date et heure *</Label>
            <Input
              id="bc-starts"
              type="datetime-local"
              value={form.starts_at ? form.starts_at.slice(0, 16) : ''}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  starts_at: e.target.value ? new Date(e.target.value).toISOString() : '',
                }))
              }
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bc-loc">Nom du lieu *</Label>
            <Input
              id="bc-loc"
              value={form.location_name}
              onChange={(e) => setForm((prev) => ({ ...prev, location_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bc-addr">Adresse</Label>
            <Input
              id="bc-addr"
              value={form.location_address ?? ''}
              onChange={set('location_address')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bc-lat">Latitude</Label>
              <Input
                id="bc-lat"
                type="number"
                step="any"
                placeholder="48.8014"
                value={form.lat ?? ''}
                onChange={setNum('lat')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bc-lng">Longitude</Label>
              <Input
                id="bc-lng"
                type="number"
                step="any"
                placeholder="2.1301"
                value={form.lng ?? ''}
                onChange={setNum('lng')}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement…' : bootcamp ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
