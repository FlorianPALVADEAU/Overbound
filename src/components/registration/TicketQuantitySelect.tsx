'use client'

import { useId, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  buildQuantityOptions,
  QUANTITY_DROPDOWN_MAX,
  QUANTITY_INPUT_MAX,
  quantityOption,
} from '@/lib/checkout/quantityOptions'

const MORE = 'more'

interface TicketQuantitySelectProps {
  ticketName: string
  quantity: number
  onChange: (quantity: number) => void
  unitCents: number | null
  otherTicketCount: number
  disabled?: boolean
}

const optionLabel = (quantity: number, percent: number) =>
  `${quantity} billet${quantity > 1 ? 's' : ''}${percent > 0 ? ` · −${percent} %` : ''}`

export default function TicketQuantitySelect({
  ticketName,
  quantity,
  onChange,
  unitCents,
  otherTicketCount,
  disabled = false,
}: TicketQuantitySelectProps) {
  const inputId = useId()
  const [forceInput, setForceInput] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const showInput = forceInput || quantity > QUANTITY_DROPDOWN_MAX
  const pricing = { unitCents: unitCents ?? 0, otherTicketCount }
  const options = buildQuantityOptions(pricing)

  const handleSelect = (value: string) => {
    if (value === MORE) {
      setForceInput(true)
      setDraft(String(QUANTITY_DROPDOWN_MAX + 1))
      onChange(QUANTITY_DROPDOWN_MAX + 1)
      return
    }
    setForceInput(false)
    setDraft(null)
    onChange(Number(value))
  }

  const commitDraft = (raw: string) => {
    const parsed = Number.parseInt(raw, 10)
    if (Number.isNaN(parsed)) return
    onChange(Math.min(Math.max(parsed, QUANTITY_DROPDOWN_MAX + 1), QUANTITY_INPUT_MAX))
  }

  const current = quantity > 0 && unitCents ? quantityOption(pricing, quantity) : null

  return (
    <div className="w-full space-y-2 md:w-auto">
      <Select value={showInput ? MORE : String(quantity)} onValueChange={handleSelect} disabled={disabled}>
        <SelectTrigger size="lg" className="w-full md:w-72" aria-label={`Quantité pour ${ticketName}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Aucun billet</SelectItem>
          {options.length > 0
            ? options.map((option) => (
                <SelectItem key={option.quantity} value={String(option.quantity)}>
                  {optionLabel(option.quantity, option.percent)}
                </SelectItem>
              ))
            : Array.from({ length: QUANTITY_DROPDOWN_MAX }, (_, index) => (
                <SelectItem key={index + 1} value={String(index + 1)}>
                  {index + 1} billet{index > 0 ? 's' : ''}
                </SelectItem>
              ))}
          <SelectItem value={MORE}>{`${QUANTITY_DROPDOWN_MAX + 1} billets ou plus…`}</SelectItem>
        </SelectContent>
      </Select>

      {showInput ? (
        <div className="space-y-1">
          <label htmlFor={inputId} className="text-xs text-muted-foreground">
            Nombre de billets ({QUANTITY_DROPDOWN_MAX + 1} à {QUANTITY_INPUT_MAX})
          </label>
          <Input
            id={inputId}
            type="number"
            inputMode="numeric"
            min={QUANTITY_DROPDOWN_MAX + 1}
            max={QUANTITY_INPUT_MAX}
            className="h-11 w-full md:w-72"
            value={draft ?? String(quantity)}
            onChange={(event) => {
              setDraft(event.target.value)
              const parsed = Number.parseInt(event.target.value, 10)
              if (parsed > QUANTITY_DROPDOWN_MAX) commitDraft(event.target.value)
            }}
            onBlur={(event) => {
              commitDraft(event.target.value)
              setDraft(null)
            }}
          />
        </div>
      ) : null}

      {current && quantity > QUANTITY_DROPDOWN_MAX && current.percent > 0 ? (
        <p className="text-xs text-muted-foreground">Remise de groupe : −{current.percent} %</p>
      ) : null}
    </div>
  )
}
