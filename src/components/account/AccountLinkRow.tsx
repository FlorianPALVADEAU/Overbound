import Link from 'next/link'
import { ChevronRightIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AccountLinkRowProps {
  href: string
  title: string
  detail?: ReactNode
  /** Highlights the row (e.g. an action the user should take). */
  emphasis?: boolean
}

/** Full-width tappable row; replaces the "card with a title and a button" pattern. */
export function AccountLinkRow({ href, title, detail, emphasis }: AccountLinkRowProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-14 items-center justify-between gap-4 border-t border-border py-3 first:border-t-0"
    >
      <span className="min-w-0">
        <span className={cn('block text-base font-semibold', emphasis && 'text-primary')}>{title}</span>
        {detail ? <span className="mt-0.5 block truncate text-sm text-muted-foreground">{detail}</span> : null}
      </span>
      <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
