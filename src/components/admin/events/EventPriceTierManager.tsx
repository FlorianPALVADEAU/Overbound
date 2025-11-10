'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Calendar, Percent, MoveUp, MoveDown } from 'lucide-react'
import type { EventPriceTier } from '@/types/EventPriceTier'
import { formatDiscount } from '@/types/EventPriceTier'

interface EventPriceTierManagerProps {
  eventId: string
  tiers: EventPriceTier[]
  onTiersChange: (tiers: EventPriceTier[]) => void
}

interface TierFormData {
  id?: string
  name: string
  discount_percentage: string
  available_from: string
  available_until: string
  display_order: number
}

export function EventPriceTierManager({ eventId, tiers, onTiersChange }: EventPriceTierManagerProps) {
  const [localTiers, setLocalTiers] = useState<TierFormData[]>(
    tiers && tiers.length > 0
      ? tiers.filter((tier) => tier != null).map((tier) => ({
          id: tier.id,
          name: tier.name,
          discount_percentage: tier.discount_percentage.toString(),
          available_from: tier.available_from
            ? new Date(tier.available_from).toISOString().slice(0, 16)
            : '',
          available_until: tier.available_until
            ? new Date(tier.available_until).toISOString().slice(0, 16)
            : '',
          display_order: tier.display_order,
        }))
      : [
          {
            name: 'Early Bird',
            discount_percentage: '50',
            available_from: '',
            available_until: '',
            display_order: 0,
          },
        ]
  )

  const [saving, setSaving] = useState(false)

  // Update localTiers when tiers prop changes
  useEffect(() => {
    if (tiers && tiers.length > 0) {
      setLocalTiers(
        tiers.filter((tier) => tier != null).map((tier) => ({
          id: tier.id,
          name: tier.name,
          discount_percentage: tier.discount_percentage.toString(),
          available_from: tier.available_from
            ? new Date(tier.available_from).toISOString().slice(0, 16)
            : '',
          available_until: tier.available_until
            ? new Date(tier.available_until).toISOString().slice(0, 16)
            : '',
          display_order: tier.display_order,
        }))
      )
    }
  }, [tiers])

  const handleAddTier = () => {
    setLocalTiers([
      ...localTiers,
      {
        name: '',
        discount_percentage: '0',
        available_from: '',
        available_until: '',
        display_order: localTiers.length,
      },
    ])
  }

  const handleRemoveTier = (index: number) => {
    setLocalTiers(localTiers.filter((_, i) => i !== index))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...localTiers]
    const temp = updated[index]
    updated[index] = updated[index - 1]
    updated[index - 1] = temp
    setLocalTiers(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index === localTiers.length - 1) return
    const updated = [...localTiers]
    const temp = updated[index]
    updated[index] = updated[index + 1]
    updated[index + 1] = temp
    setLocalTiers(updated)
  }

  const handleTierChange = (index: number, field: keyof TierFormData, value: string | number) => {
    const updated = [...localTiers]
    updated[index] = { ...updated[index], [field]: value }
    setLocalTiers(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Delete existing tiers that are not in the new list
      const existingIds = tiers.map((t) => t.id)
      const newIds = localTiers.filter((t) => t.id).map((t) => t.id)
      const toDelete = existingIds.filter((id) => !newIds.includes(id))

      for (const id of toDelete) {
        await fetch(`/api/admin/event-price-tiers/${id}`, {
          method: 'DELETE',
        })
      }

      // Update or create tiers
      const updatedTiers: EventPriceTier[] = []
      for (const [index, tier] of localTiers.entries()) {
        const payload = {
          event_id: eventId,
          name: tier.name,
          discount_percentage: parseInt(tier.discount_percentage, 10),
          available_from: tier.available_from || null,
          available_until: tier.available_until || null,
          display_order: index,
        }

        if (tier.id) {
          // Update existing
          const res = await fetch(`/api/admin/event-price-tiers/${tier.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const { tier: updated } = await res.json()
          updatedTiers.push(updated)
        } else {
          // Create new
          const res = await fetch('/api/admin/event-price-tiers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const { tier: created } = await res.json()
          updatedTiers.push(created)
        }
      }

      onTiersChange(updatedTiers)
      alert('Paliers de prix enregistrés avec succès')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paliers:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paliers de prix</CardTitle>
        <CardDescription>
          Définissez les paliers de réduction en pourcentage qui s'appliqueront à tous les tickets de
          cet événement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {localTiers.map((tier, index) => (
          <div key={index} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Palier {index + 1}</h4>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="h-8 w-8 p-0"
                  title="Déplacer vers le haut"
                >
                  <MoveUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === localTiers.length - 1}
                  className="h-8 w-8 p-0"
                  title="Déplacer vers le bas"
                >
                  <MoveDown className="h-4 w-4" />
                </Button>
                {localTiers.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTier(index)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor={`tier-name-${index}`}>Nom du palier</Label>
                <Input
                  id={`tier-name-${index}`}
                  value={tier.name}
                  onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                  placeholder="Ex: Early Bird, Standard, Prix Final"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`tier-discount-${index}`}>
                  <Percent className="h-4 w-4 inline mr-1" />
                  Réduction (%)
                </Label>
                <Input
                  id={`tier-discount-${index}`}
                  type="number"
                  min="0"
                  max="100"
                  value={tier.discount_percentage}
                  onChange={(e) => handleTierChange(index, 'discount_percentage', e.target.value)}
                  placeholder="50 = -50%"
                />
                <p className="text-xs text-muted-foreground">
                  {tier.discount_percentage !== ''
                    ? formatDiscount(parseInt(tier.discount_percentage, 10))
                    : '—'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`tier-from-${index}`}>
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Début
                </Label>
                <Input
                  id={`tier-from-${index}`}
                  type="datetime-local"
                  value={tier.available_from}
                  onChange={(e) => handleTierChange(index, 'available_from', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`tier-until-${index}`}>
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Fin
                </Label>
                <Input
                  id={`tier-until-${index}`}
                  type="datetime-local"
                  value={tier.available_until}
                  onChange={(e) => handleTierChange(index, 'available_until', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleAddTier} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un palier
          </Button>
        </div>

        <div className="pt-4 border-t">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Enregistrement...' : 'Enregistrer les paliers'}
          </Button>
        </div>

        <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          <p className="font-semibold mb-1">💡 Comment ça marche ?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Chaque palier applique une <strong>réduction en pourcentage</strong> sur le prix final de tous
              les tickets
            </li>
            <li>
              Exemple : ticket à 100€ avec palier -50% = <strong>50€</strong>
            </li>
            <li>Le palier "Prix Final" devrait avoir 0% de réduction</li>
            <li>Les paliers sont automatiquement appliqués selon les dates</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
