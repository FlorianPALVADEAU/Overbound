'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatPrice, joinName, resolveUpsellSizes } from '@/lib/registration'
import { readAssignments, upsellMaxPerParticipant } from '@/lib/upsells/assignments'
import { cn } from '@/lib/utils'
import type { EventUpsell, Participant } from './types'
import QuantityPicker from './QuantityPicker'
import { UpsellImagePreview } from './UpsellImagePreview'

interface UpsellCardProps {
  upsell: EventUpsell
  selection: { quantity: number; meta?: Record<string, any> } | undefined
  participants: Participant[]
  defaultCurrency: string
  onSetForParticipant: (upsellId: string, participantId: string, quantity: number, size?: string) => void
  onSetForAll: (upsellId: string, quantity: number) => void
  onClear: (upsellId: string) => void
  onSizeForAll: (upsellId: string, size: string) => void
}

const MODES = ['none', 'all', 'some'] as const
const LONG_LIST = 8

export default function UpsellCard({
  upsell,
  selection,
  participants,
  defaultCurrency,
  onSetForParticipant,
  onSetForAll,
  onClear,
  onSizeForAll,
}: UpsellCardProps) {
  const [showList, setShowList] = useState(false)
  const assignments = readAssignments(selection?.meta)
  const byParticipant = new Map(assignments.map((entry) => [entry.participantId, entry]))
  const total = participants.length
  const taking = assignments.length
  const mode: (typeof MODES)[number] = taking === 0 ? 'none' : taking === total ? 'all' : 'some'
  const isTshirt = upsell.type === 'tshirt'
  const sizes = isTshirt ? resolveUpsellSizes(upsell) : []
  const max = upsellMaxPerParticipant(upsell.type)
  const isToggle = max === 1
  const nameOf = (participant: Participant, index: number) => joinName(participant.firstName, participant.lastName) || `Participant ${index + 1}`
  const commonSize = assignments.length > 0 && assignments.every((entry) => entry.size === assignments[0].size) ? assignments[0].size : undefined
  const price = formatPrice(upsell.price_cents, (upsell.currency || defaultCurrency).toLowerCase())

  const sizeSelect = (value: string | undefined, onChange: (size: string) => void, label: string, className?: string) => (
    <Select value={value ?? ''} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className={cn('h-11 w-full', className)}>
        <SelectValue placeholder="Taille" />
      </SelectTrigger>
      <SelectContent>
        {sizes.map((size) => (
          <SelectItem key={size} value={size}>
            {size}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const row = (participant: Participant, index: number) => {
    const current = byParticipant.get(participant.id)
    const name = nameOf(participant, index)
    return (
      <li key={participant.id} className="py-3">
        {isToggle ? (
          <div className="space-y-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <Checkbox
                checked={Boolean(current)}
                onCheckedChange={(checked) => onSetForParticipant(upsell.id, participant.id, checked === true ? 1 : 0)}
                aria-label={`${upsell.name} pour ${name}`}
              />
              <span className="min-w-0 truncate">{name}</span>
            </label>
            {isTshirt && current ? sizeSelect(current.size, (size) => onSetForParticipant(upsell.id, participant.id, 1, size), `Taille pour ${name}`, 'sm:w-48') : null}
          </div>
        ) : (
          <div className="flex min-h-11 items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{name}</span>
            <QuantityPicker
              value={current?.quantity ?? 0}
              onDecrement={() => onSetForParticipant(upsell.id, participant.id, (current?.quantity ?? 0) - 1)}
              onIncrement={() => onSetForParticipant(upsell.id, participant.id, (current?.quantity ?? 0) + 1)}
              disableDecrement={(current?.quantity ?? 0) === 0}
              disableIncrement={(current?.quantity ?? 0) >= max}
            />
          </div>
        )}
      </li>
    )
  }

  return (
    <div className={cn('rounded-2xl border bg-card p-5 transition-colors', selection ? 'border-primary ring-1 ring-primary' : 'border-border')}>
      <div className="flex items-start gap-4">
        <UpsellImagePreview
          src={upsell.image_url}
          sources={upsell.images?.map((image) => ({ src: image.url ?? image.external_url, alt: image.alt_text }))}
          alt={upsell.name}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-base font-semibold">{upsell.name}</p>
            <p className="shrink-0 text-base font-semibold text-primary">{price}</p>
          </div>
          {upsell.description ? <p className="mt-1 text-sm text-muted-foreground">{upsell.description}</p> : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {max === 1 ? 'Un par participant.' : `${max} maximum par participant.`}
          </p>
        </div>
      </div>

      {total === 1 ? (
        <div className="mt-4 space-y-3">
          {isToggle ? (
            <Button
              type="button"
              size="cta"
              variant={mode === 'all' ? 'default' : 'outline'}
              className="w-full"
              aria-pressed={mode === 'all'}
              onClick={() => (mode === 'all' ? onClear(upsell.id) : onSetForAll(upsell.id, 1))}
            >
              {mode === 'all' ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Ajouté
                </>
              ) : (
                'Ajouter'
              )}
            </Button>
          ) : (
            <QuantityPicker
              value={assignments[0]?.quantity ?? 0}
              onDecrement={() => onSetForParticipant(upsell.id, participants[0].id, (assignments[0]?.quantity ?? 0) - 1)}
              onIncrement={() => onSetForParticipant(upsell.id, participants[0].id, (assignments[0]?.quantity ?? 0) + 1)}
              disableDecrement={(assignments[0]?.quantity ?? 0) === 0}
              disableIncrement={(assignments[0]?.quantity ?? 0) >= max}
            />
          )}
          {isTshirt && mode === 'all'
            ? sizeSelect(assignments[0]?.size, (size) => onSizeForAll(upsell.id, size), 'Taille', 'sm:w-48')
            : null}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div role="group" aria-label={`Pour qui : ${upsell.name}`} className="grid grid-cols-3 gap-2">
            {[
              { id: 'none', label: 'Personne', active: mode === 'none', onClick: () => { onClear(upsell.id); setShowList(false) } },
              { id: 'all', label: `Tous (${total})`, active: mode === 'all', onClick: () => { onSetForAll(upsell.id, 1); setShowList(false) } },
              { id: 'some', label: 'Choisir', active: mode === 'some' || showList, onClick: () => setShowList(true) },
            ].map((option) => (
              <Button
                key={option.id}
                type="button"
                variant={option.active ? 'default' : 'outline'}
                className="h-11 px-2"
                aria-pressed={option.active}
                onClick={option.onClick}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {isTshirt && mode !== 'none' ? (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Même taille pour tous</p>
              {sizeSelect(commonSize, (size) => onSizeForAll(upsell.id, size), 'Même taille pour tous', 'sm:w-48')}
            </div>
          ) : null}

          {mode === 'all' && !showList ? (
            <button
              type="button"
              onClick={() => setShowList(true)}
              className="min-h-11 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {isTshirt ? 'Changer une taille ou retirer quelqu’un' : 'Retirer quelqu’un'}
            </button>
          ) : null}

          {showList || mode === 'some' ? (
            <ul className={cn('divide-y divide-border', total > LONG_LIST && 'max-h-96 overflow-y-auto pr-1')}>
              {participants.map(row)}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  )
}
