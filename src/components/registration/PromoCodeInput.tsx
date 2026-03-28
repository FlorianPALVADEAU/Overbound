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
    <div className="space-y-3">
      <div className="text-xs uppercase text-muted-foreground">Code promotionnel</div>
      {appliedPromos.length > 0 ? (
        <div className="space-y-2">
          {appliedPromos.map((appliedPromo) => (
            <div key={appliedPromo.code} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 p-4">
              <div>
                <p className="text-sm font-semibold text-primary">Code {appliedPromo.code}</p>
                {appliedPromo.description ? (
                  <p className="text-xs text-muted-foreground">{appliedPromo.description}</p>
                ) : null}
                {appliedPromo.is_ambassador ? (
                  <p className="text-xs text-muted-foreground">
                    Code ambassadeur appliqué.
                  </p>
                ) : null}
              </div>
              <Button variant="ghost" size="sm" onClick={() => onRemove(appliedPromo.code)}>
                Retirer
              </Button>
            </div>
          ))}
        </div>
      ) : null}
      {canAddMore ? (
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={promoInput}
            onChange={(e) => onInputChange(e.target.value.toUpperCase())}
            placeholder="EX: OVERBOUND10"
            className="md:max-w-xs"
          />
          <Button type="button" onClick={onValidate}>
            Appliquer
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Limite atteinte: 2 codes promo maximum.</p>
      )}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
