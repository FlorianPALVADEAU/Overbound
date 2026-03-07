import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AppliedPromo } from './types'

interface PromoCodeInputProps {
  appliedPromo: AppliedPromo | null
  promoInput: string
  onInputChange: (value: string) => void
  onValidate: () => void
  onRemove: () => void
  error: string | null
}

export default function PromoCodeInput({
  appliedPromo,
  promoInput,
  onInputChange,
  onValidate,
  onRemove,
  error,
}: PromoCodeInputProps) {
  return (
    <div className="space-y-3">
      <div className="text-xs uppercase text-muted-foreground">Code promotionnel</div>
      {appliedPromo ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 p-4">
          <div>
            <p className="text-sm font-semibold text-primary">Code {appliedPromo.code}</p>
            {appliedPromo.description ? (
              <p className="text-xs text-muted-foreground">{appliedPromo.description}</p>
            ) : null}
            {appliedPromo.is_ambassador ? (
              <p className="text-xs text-muted-foreground">
                Code ambassadeur appliqué. Un seul code promo est autorise par commande.
              </p>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Retirer
          </Button>
        </div>
      ) : (
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
      )}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
