import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AppliedPromo } from './types'

interface PromoCodeInputProps {
  appliedPromos: AppliedPromo[]
  promoInput: string
  onInputChange: (value: string) => void
  onValidate: () => void
  onRemove: (code: string) => void
  error: string | null
}

/** Collapsed behind one line until needed: most visitors have no code. */
export default function PromoCodeInput({
  appliedPromos,
  promoInput,
  onInputChange,
  onValidate,
  onRemove,
  error,
}: PromoCodeInputProps) {
  const canAddMore = appliedPromos.length < 2

  return (
    <details className="group" open={appliedPromos.length > 0 || Boolean(error)}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-medium text-primary underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
        J&apos;ai un code promo
      </summary>
      <div className="space-y-3 pb-1 pt-2">
        {appliedPromos.map((appliedPromo) => (
          <div key={appliedPromo.code} className="flex items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold">Code {appliedPromo.code}</p>
              {appliedPromo.description ? (
                <p className="text-xs text-muted-foreground">{appliedPromo.description}</p>
              ) : null}
            </div>
            <Button variant="ghost" size="sm" onClick={() => onRemove(appliedPromo.code)}>
              Retirer
            </Button>
          </div>
        ))}
        {canAddMore ? (
          <div className="flex gap-2">
            <Input
              value={promoInput}
              onChange={(e) => onInputChange(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onValidate()
                }
              }}
              placeholder="EX: OVERBOUND10"
              aria-label="Code promo"
              className="h-11"
            />
            <Button type="button" variant="outline" className="h-11" onClick={onValidate}>
              Appliquer
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">2 codes promo maximum.</p>
        )}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    </details>
  )
}
