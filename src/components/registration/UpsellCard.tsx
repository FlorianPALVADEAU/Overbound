import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatPrice, joinName, resolveUpsellSizes, normalizeTshirtSizes } from '@/lib/registration'
import { getUpsellQuantityLimit } from '@/lib/upsells/quantity'
import { cn } from '@/lib/utils'
import type { EventUpsell, Participant } from './types'
import QuantityPicker from './QuantityPicker'
import { UpsellImagePreview } from './UpsellImagePreview'

interface UpsellCardProps {
  upsell: EventUpsell
  selection: { quantity: number; meta?: Record<string, any> } | undefined
  selectedTicketSlots: string[]
  participants: Participant[]
  defaultCurrency: string
  onQuantityChange: (upsellId: string, quantity: number) => void
  onSizeChange: (upsellId: string, index: number, size: string) => void
  onPhotoPackToggle: (upsellId: string, ticketId: string, checked: boolean) => void
}

export default function UpsellCard({
  upsell,
  selection,
  selectedTicketSlots,
  participants,
  defaultCurrency,
  onQuantityChange,
  onSizeChange,
  onPhotoPackToggle,
}: UpsellCardProps) {
  const quantity = selection?.quantity ?? 0
  const isSelected = quantity > 0
  const availableSizes = upsell.type === 'tshirt' ? resolveUpsellSizes(upsell) : []
  const selectedSizes =
    upsell.type === 'tshirt' ? normalizeTshirtSizes(selection?.meta, quantity, availableSizes) : []
  const maxQuantity = getUpsellQuantityLimit(upsell.type, selectedTicketSlots.length)
  const addDisabled = maxQuantity === 0 || quantity >= maxQuantity
  const isPhotoPack = upsell.type === 'photos'
  const assignments: string[] = Array.isArray(selection?.meta?.assignments) ? (selection!.meta!.assignments as string[]) : []

  // Several participants can share one ticket type: the nth participant of a
  // type is "ticked" when more packs than the n-1 before it are assigned to it.
  const isPackTicked = (index: number) => {
    const ticketId = participants[index]?.ticketId
    const rank = participants.slice(0, index).filter((p) => p.ticketId === ticketId).length
    return assignments.filter((id) => id === ticketId).length > rank
  }

  return (
    <div className={cn('rounded-2xl border bg-card p-5 transition-colors', isSelected ? 'border-primary ring-1 ring-primary' : 'border-border')}>
      <div className="flex items-start gap-4">
        <UpsellImagePreview
          src={upsell.image_url}
          sources={upsell.images?.map((image) => ({ src: image.url ?? image.external_url, alt: image.alt_text }))}
          alt={upsell.name}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-semibold">{upsell.name}</p>
              {upsell.description ? <p className="mt-1 text-sm text-muted-foreground">{upsell.description}</p> : null}
            </div>
            <p className="shrink-0 text-base font-semibold text-primary">
              {formatPrice(upsell.price_cents, (upsell.currency || defaultCurrency).toLowerCase())}
            </p>
          </div>

          {!isPhotoPack ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <QuantityPicker
                value={quantity}
                onDecrement={() => onQuantityChange(upsell.id, quantity - 1)}
                onIncrement={() => onQuantityChange(upsell.id, quantity + 1)}
                disableDecrement={quantity === 0}
                disableIncrement={addDisabled}
              />
              {upsell.type === 'patch' && maxQuantity > 0 ? (
                <p className="text-xs text-muted-foreground">2 maximum par billet</p>
              ) : null}
            </div>
          ) : null}

          {upsell.type === 'tshirt' && quantity > 0 ? (
            <div className="mt-4 space-y-2">
              {selectedSizes.map((size, index) => (
                <div key={`${upsell.id}-size-${index}`} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-sm text-muted-foreground">T-shirt {index + 1}</span>
                  <Select value={size} onValueChange={(value) => onSizeChange(upsell.id, index, value)}>
                    <SelectTrigger className="h-11 w-full sm:w-48">
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

          {isPhotoPack ? (
            <div className="mt-4 space-y-2">
              {participants.map((participant, index) => {
                const ticked = isPackTicked(index)
                const name = joinName(participant.firstName, participant.lastName) || `Participant ${index + 1}`
                const disabled = !ticked && assignments.length >= maxQuantity
                return (
                  <div key={participant.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`${upsell.id}-${participant.id}`}
                      checked={ticked}
                      disabled={disabled}
                      onCheckedChange={(checked) => onPhotoPackToggle(upsell.id, participant.ticketId, checked === true)}
                    />
                    <Label htmlFor={`${upsell.id}-${participant.id}`} className="text-sm font-normal">
                      Pour {name}
                    </Label>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
