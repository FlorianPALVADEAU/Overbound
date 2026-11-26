import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { joinBirthDate, splitBirthDate, type BirthDateParts } from '@/lib/checkout/birthDateParts'

interface BirthDateFieldProps {
  /** Id of the first input (the day): the checkout focuses it when the date is missing. */
  id: string
  /** Stored "YYYY-MM-DD", or '' while the date is incomplete. */
  value: string
  onChange: (iso: string) => void
  error?: string
  errorId?: string
}

/** Three numeric boxes: no phone date wheel to spin back thirty years. */
export default function BirthDateField({ id, value, onChange, error, errorId }: BirthDateFieldProps) {
  const [parts, setParts] = useState<BirthDateParts>(() => splitBirthDate(value))
  const monthRef = useRef<HTMLInputElement>(null)
  const yearRef = useRef<HTMLInputElement>(null)

  // A prefill or a restored draft changes the stored date from outside: follow it.
  useEffect(() => {
    if (value && value !== joinBirthDate(parts)) setParts(splitBirthDate(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only an external change of the stored date matters
  }, [value])

  const update = (key: keyof BirthDateParts, raw: string, max: number, next?: React.RefObject<HTMLInputElement | null>) => {
    const digits = raw.replace(/\D/g, '').slice(0, max)
    const nextParts = { ...parts, [key]: digits }
    setParts(nextParts)
    onChange(joinBirthDate(nextParts))
    if (digits.length === max && next) next.current?.focus()
  }

  const box = (props: {
    id?: string
    label: string
    placeholder: string
    value: string
    max: number
    width: string
    onChange: (raw: string) => void
    inputRef?: React.RefObject<HTMLInputElement | null>
    autoComplete: string
  }) => (
    <Input
      id={props.id}
      ref={props.inputRef}
      inputMode="numeric"
      autoComplete={props.autoComplete}
      aria-label={props.label}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
      placeholder={props.placeholder}
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
      className={cn('h-11 text-center', props.width, error && 'border-destructive focus-visible:ring-destructive')}
    />
  )

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        Date de naissance{' '}
        <span className="text-destructive" aria-hidden>
          *
        </span>
      </Label>
      <div role="group" aria-label="Date de naissance" className="flex gap-2">
        {box({ id, label: 'Jour', placeholder: 'JJ', value: parts.day, max: 2, width: 'w-16', autoComplete: 'bday-day', onChange: (raw) => update('day', raw, 2, monthRef) })}
        {box({ label: 'Mois', placeholder: 'MM', value: parts.month, max: 2, width: 'w-16', autoComplete: 'bday-month', inputRef: monthRef, onChange: (raw) => update('month', raw, 2, yearRef) })}
        {box({ label: 'Année', placeholder: 'AAAA', value: parts.year, max: 4, width: 'w-24', autoComplete: 'bday-year', inputRef: yearRef, onChange: (raw) => update('year', raw, 4) })}
      </div>
      {error ? (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
