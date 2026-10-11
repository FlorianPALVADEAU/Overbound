import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Small rounded tag (docs/design/design-system.md). For a label above a
 * title use Eyebrow; for a status in data tables use the shadcn Badge.
 */
export type PillVariant = 'tag' | 'tag-muted' | 'glass'

const VARIANT_CLASS: Record<PillVariant, string> = {
  tag: 'bg-primary text-primary-foreground text-label font-semibold uppercase',
  'tag-muted': 'border border-foreground/30 text-muted-foreground text-label font-semibold uppercase',
  glass: 'gap-2 bg-foreground/10 text-sm font-semibold text-foreground backdrop-blur-sm',
}

interface Props {
  variant?: PillVariant
  className?: string
  children: ReactNode
}

export function Pill({ variant = 'tag', className, children }: Props) {
  return (
    <span className={cn('inline-flex w-fit items-center rounded-full px-3 py-1', VARIANT_CLASS[variant], className)}>
      {children}
    </span>
  )
}
