import Link from 'next/link'
import { FLEXIBLE_REFUND_DEADLINE_DAYS } from '@/lib/tickets/flexibleTicket'
import { cn } from '@/lib/utils'

interface RefundNoticeProps {
  /** At least one bib of the order carries the flexible option. */
  hasFlexible: boolean
  className?: string
}

/** Refund policy in plain sight: no hover-only tooltip, readable on a phone. */
export default function RefundNotice({ hasFlexible, className }: RefundNoticeProps) {
  return (
    <div className={cn('text-xs text-muted-foreground', className)}>
      <Link
        href="/cgv#annulation-participant"
        className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-foreground"
      >
        Voir les CGV
      </Link>
    </div>
  )
}
