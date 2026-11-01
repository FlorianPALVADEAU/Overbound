import { cn } from '@/lib/utils'
import type { TshirtOffer } from '@/lib/tshirtOffer'

/** Thin line that shrinks as the T-shirts go. */
export function TshirtMeter({ offer, className }: { offer: TshirtOffer; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`${offer.remaining} T-shirts offerts restants sur ${offer.quota}`}
      className={cn('h-1 w-full overflow-hidden rounded-full bg-foreground/15', className)}
    >
      <div className="h-full rounded-full bg-primary" style={{ width: `${(offer.remaining / offer.quota) * 100}%` }} />
    </div>
  )
}
