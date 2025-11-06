'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus, GripVertical } from 'lucide-react'

export interface PriceTierFormValue {
  price_cents: string
  available_from: string
  available_until: string
  display_order: number
  id?: string // For existing tiers
}

interface PriceTierManagerProps {
  tiers: PriceTierFormValue[]
  currency: string
  onChange: (tiers: PriceTierFormValue[]) => void
}

export function PriceTierManager({ tiers, currency, onChange }: PriceTierManagerProps) {
  const addTier = () => {
    const newTier: PriceTierFormValue = {
      price_cents: '0',
      available_from: '',
      available_until: '',
      display_order: tiers.length,
    }
    onChange([...tiers, newTier])
  }

  const removeTier = (index: number) => {
    if (tiers.length <= 1) {
      alert('Au moins un palier de prix est requis')
      return
    }
    const newTiers = tiers.filter((_, i) => i !== index)
    // Re-index display_order
    onChange(newTiers.map((tier, i) => ({ ...tier, display_order: i })))
  }

  const updateTier = (index: number, field: keyof PriceTierFormValue, value: string | number) => {
    const newTiers = [...tiers]
    // Format date to YYYY-MM-DD
    if (field === 'available_from' || field === 'available_until') {
      const date = new Date(value as string)
      value = date.toISOString().split('T')[0]
    }
    newTiers[index] = { ...newTiers[index], [field]: value }
    onChange(newTiers)
  }

  const moveTier = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === tiers.length - 1) return

    const newTiers = [...tiers]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newTiers[index], newTiers[targetIndex]] = [newTiers[targetIndex], newTiers[index]]

    // Update display_order
    onChange(newTiers.map((tier, i) => ({ ...tier, display_order: i })))
  }

  const getCurrencySymbol = (currency: string) => {
    switch (currency.toLowerCase()) {
      case 'eur':
        return '€'
      case 'usd':
        return '$'
      case 'gbp':
        return '£'
      default:
        return currency
    }
  }

  const formatPriceForDisplay = (priceCents: string) => {
    const cents = parseInt(priceCents) || 0
    return (cents / 100).toFixed(2)
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Paliers de prix progressifs</h4>
          <p className="text-sm text-muted-foreground">
            Configurez les augmentations de prix dans le temps. Au moins un palier est requis.
          </p>
        </div>
        <Button type="button" size="sm" onClick={addTier} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un palier
        </Button>
      </div>

      <div className="space-y-3">
        {tiers.map((tier, index) => (
          <div key={index} className="relative rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              {/* Drag handle - visual only for now */}
              <div className="flex flex-col gap-1 pt-7">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => moveTier(index, 'up')}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => moveTier(index, 'down')}
                  disabled={index === tiers.length - 1}
                >
                  ↓
                </Button>
              </div>

              {/* Form fields */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`tier-price-${index}`}>
                    Prix ({getCurrencySymbol(currency)}) *
                  </Label>
                  <div className="relative">
                    <Input
                      id={`tier-price-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={formatPriceForDisplay(tier.price_cents)}
                      onChange={(e) => {
                        const euros = parseFloat(e.target.value) || 0
                        const cents = Math.round(euros * 100)
                        updateTier(index, 'price_cents', cents.toString())
                      }}
                      placeholder="20.00"
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                      {getCurrencySymbol(currency)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    = {tier.price_cents} centimes
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tier-from-${index}`}>Date de début</Label>
                  <Input
                    id={`tier-from-${index}`}
                    type="date"
                    value={tier.available_from}
                    // format date to YYYY-MM-DD
                    onChange={(e) => updateTier(index, 'available_from', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tier-until-${index}`}>Date de fin</Label>
                  <Input
                    id={`tier-until-${index}`}
                    type="date"
                    value={tier.available_until}
                    onChange={(e) => updateTier(index, 'available_until', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Laissez vide pour la fin des ventes
                  </p>
                </div>
              </div>

              {/* Delete button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeTier(index)}
                disabled={tiers.length <= 1}
                className="mt-7"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            {/* Tier number badge */}
            <div className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              {index + 1}
            </div>
          </div>
        ))}
      </div>

      {tiers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Aucun palier de prix configuré.</p>
          <p className="text-sm">Cliquez sur "Ajouter un palier" pour commencer.</p>
        </div>
      )}
    </div>
  )
}
