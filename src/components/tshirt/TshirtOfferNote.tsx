import { Shirt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tshirtHeadline, type TshirtOffer } from '@/lib/tshirtOffer'
import { TshirtMeter } from './TshirtMeter'

interface Props {
  offer: TshirtOffer | null | undefined
  /** Smaller line under the headline. */
  hint?: string
  className?: string
}

/** The offer as a quiet note: one line, one thin meter. Renders nothing without stock. */
export function TshirtOfferNote({ offer, hint, className }: Props) {
  const headline = offer ? tshirtHeadline(offer) : null
  if (!offer || !headline) return null

  return (
    <div className={cn('space-y-2', className)}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Shirt aria-hidden className="size-4 shrink-0 text-primary" />
        {headline}
      </p>
      <TshirtMeter offer={offer} className="max-w-xs" />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
