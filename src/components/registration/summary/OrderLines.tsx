import type { OrderLine } from '@/lib/checkout/orderLines'
import { formatPrice } from '@/lib/registration'
import { cn } from '@/lib/utils'

interface OrderLinesProps {
  lines: OrderLine[]
  currency: string
  emptyLabel?: string
}

/** Every line of an order. Renders what it is given: no price is computed here. */
export default function OrderLines({ lines, currency, emptyLabel = 'Choisis un billet pour commencer.' }: OrderLinesProps) {
  if (lines.length === 0) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>

  return (
    <ul className="space-y-3 text-base">
      {lines.map((line) => (
        <li
          key={line.key}
          className={cn(
            'flex items-start justify-between gap-3',
            line.kind === 'discount' && 'text-primary',
            line.nested && '-mt-1 ml-3 border-l border-border pl-3 text-muted-foreground',
          )}
        >
          <div className="min-w-0">
            <p className={cn(!line.nested && 'font-medium')}>{line.label}</p>
            {line.details.map((detail) => (
              <p key={detail} className="text-sm text-muted-foreground">
                {detail}
              </p>
            ))}
          </div>
          <div className="shrink-0 text-right">
            {line.fullAmountCents ? (
              <p className="text-sm text-muted-foreground line-through">{formatPrice(line.fullAmountCents, currency)}</p>
            ) : null}
            <p className={cn(!line.nested && 'font-medium')}>
              {line.amountCents < 0 ? `- ${formatPrice(-line.amountCents, currency)}` : formatPrice(line.amountCents, currency)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
