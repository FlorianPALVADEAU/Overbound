'use client'

import { useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

interface Props {
  title: ReactNode
  icon?: ReactNode
  /** Count or status shown next to the title, visible even when collapsed. */
  badge?: ReactNode
  /** One-line summary shown under the title while collapsed. */
  summary?: ReactNode
  /** Initial state below the `lg` breakpoint. From `lg` the content is always shown. */
  defaultOpen?: boolean
  id?: string
  className?: string
  children: ReactNode
}

/**
 * Card whose body folds on phones and tablets and is always open from `lg`
 * (docs/design/design-system.md, « Mobile »). The desktop state is pure CSS, so
 * there is no flash and no hydration mismatch.
 */
export function Disclosure({ title, icon, badge, summary, defaultOpen = false, id, className, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()
  return (
    <Card id={id} variant="info" className={cn('gap-0 py-0', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left sm:px-6 lg:pointer-events-none lg:cursor-default"
      >
        {icon ? <span aria-hidden className="shrink-0 text-muted-foreground">{icon}</span> : null}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 font-semibold">
            {title}
            {badge}
          </span>
          {summary ? (
            <span className={cn('mt-0.5 block text-xs text-muted-foreground', open && 'hidden lg:block')}>{summary}</span>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden
          className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-standard lg:hidden', open && 'rotate-180')}
        />
      </button>
      <div id={bodyId} className={cn('border-t border-border px-4 py-4 sm:px-6 sm:py-6', open ? 'block' : 'hidden lg:block')}>
        {children}
      </div>
    </Card>
  )
}
