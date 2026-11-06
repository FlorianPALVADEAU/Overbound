import Image from 'next/image'
import { Lock } from 'lucide-react'
import { containerClass } from '@/components/ds'
import { cn } from '@/lib/utils'

/**
 * Only chrome of the purchase tunnel. Product decision (2026-11-06): the
 * visitor is kept in the tunnel, so nothing here is a link: no logo link, no
 * back button, no exit. It only says where the visitor is and who processes
 * the payment (card and Link, via Stripe).
 */
export function CheckoutHeader() {
  return (
    <header className="border-b border-border bg-surface-deep">
      <div className={cn(containerClass(), 'flex h-14 items-center justify-between gap-4 sm:h-16')}>
        <Image
          src="/images/brand/totem_logo_white.png"
          alt="Overbound"
          width={64}
          height={64}
          priority
          className="h-auto w-8 md:w-10"
        />
        <p className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
          <Lock className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            Inscription et paiement sécurisés <span className="hidden sm:inline">via Stripe</span>
          </span>
        </p>
      </div>
    </header>
  )
}
