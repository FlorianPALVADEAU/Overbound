import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Gift } from 'lucide-react'
import { formatPrice, resolveUpsellSizes, normalizeTshirtSizes } from '@/lib/registration'
import { cn } from '@/lib/utils'
import type { EventUpsell, Participant } from './types'
import QuantityPicker from './QuantityPicker'

interface UpsellCardProps {
  upsell: EventUpsell
  selection: { quantity: number; meta?: Record<string, any> } | undefined
  selectedTicketSlots: string[]
  participants: Participant[]
  defaultCurrency: string
  onQuantityChange: (upsellId: string, quantity: number) => void
  onSizeChange: (upsellId: string, index: number, size: string) => void
  onAssignmentToggle: (upsellId: string, ticketId: string, checked: boolean) => void
}

export default function UpsellCard({
  upsell,
  selection,
  selectedTicketSlots,
  participants,
  defaultCurrency,
  onQuantityChange,
  onSizeChange,
  onAssignmentToggle,
}: UpsellCardProps) {
  const quantity = selection?.quantity ?? 0
  const isSelected = quantity > 0
  const availableSizes = upsell.type === 'tshirt' ? resolveUpsellSizes(upsell) : []
  const selectedSizes =
    upsell.type === 'tshirt' ? normalizeTshirtSizes(selection?.meta, quantity, availableSizes) : []
  const maxQuantity =
    upsell.type === 'tshirt' || upsell.type === 'photos' ? selectedTicketSlots.length : undefined
  const addDisabled =
    upsell.type === 'tshirt' || upsell.type === 'photos'
      ? !maxQuantity || quantity >= maxQuantity
      : false

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        isSelected ? 'border-primary bg-primary/5' : 'border-border',
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Gift className="h-4 w-4 text-primary" />
            {upsell.name}
          </div>
          {upsell.description && (
            <p className="text-sm text-muted-foreground">{upsell.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="text-lg font-semibold text-primary">
            {formatPrice(upsell.price_cents, (upsell.currency || defaultCurrency).toLowerCase())}
          </div>
          <QuantityPicker
            value={quantity}
            onDecrement={() => onQuantityChange(upsell.id, quantity - 1)}
            onIncrement={() => onQuantityChange(upsell.id, quantity + 1)}
            disableDecrement={quantity === 0}
            disableIncrement={addDisabled}
          />

          {upsell.type === 'tshirt' && quantity > 0 ? (
            <div className="flex w-full flex-col items-end gap-2">
              {selectedSizes.map((size, index) => (
                <div key={`${upsell.id}-size-${index}`} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">T-shirt #{index + 1}</span>
                  <Select
                    value={size}
                    onValueChange={(value) => onSizeChange(upsell.id, index, value)}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Choisir une taille" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSizes.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          ) : null}
          {upsell.type === 'tshirt' ? (
            <p className="text-xs text-muted-foreground text-right">
              {selectedTicketSlots.length > 0
                ? `Maximum ${selectedTicketSlots.length} t-shirt${selectedTicketSlots.length > 1 ? 's' : ''} (${quantity}/${selectedTicketSlots.length} sélectionné${quantity > 1 ? 's' : ''}).`
                : 'Sélectionnez au moins un billet pour ajouter un t-shirt.'}
            </p>
          ) : null}
          {upsell.type === 'photos' && quantity > 0 ? (
            <div className="flex w-full flex-col items-end gap-2 text-sm">
              <div className="text-xs text-muted-foreground">
                Assigner le pack photo (1 par billet):
              </div>
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                {participants.map((p, idx) => {
                  const assignments: string[] = (selection?.meta?.assignments ?? []) as string[]
                  const checked = assignments.includes(p.ticketId)
                  const disableUnchecked = !checked && assignments.length >= quantity
                  return (
                    <label
                      key={`${upsell.id}-assign-${p.id}`}
                      className={`flex items-center gap-2 rounded border p-2 ${checked ? 'border-primary' : 'border-border'}`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        disabled={disableUnchecked}
                        onChange={(e) =>
                          onAssignmentToggle(upsell.id, p.ticketId, e.target.checked)
                        }
                      />
                      <span>
                        Participant #{idx + 1}
                        {p.firstName || p.lastName
                          ? ` — ${p.firstName} ${p.lastName}`
                          : ''}
                      </span>
                    </label>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground text-right w-full">
                {selectedTicketSlots.length > 0
                  ? `Maximum ${selectedTicketSlots.length} pack${selectedTicketSlots.length > 1 ? 's' : ''} (${(selection?.meta?.assignments?.length || 0)}/${quantity} assigné${quantity > 1 ? 's' : ''}).`
                  : 'Sélectionnez au moins un billet pour ajouter des packs photos.'}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
