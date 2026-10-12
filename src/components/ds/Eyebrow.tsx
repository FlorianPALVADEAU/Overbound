import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Small uppercase label above a title (docs/design/design-system.md). The one
 * eyebrow style of the site: replaces the 47 inline variants found in the audit.
 */
export type EyebrowVariant = 'text' | 'pill' | 'pill-soft'

const VARIANT_CLASS: Record<EyebrowVariant, string> = {
  text: 'text-primary',
  pill: 'inline-flex w-fit items-center rounded-full bg-primary px-4 py-1 text-primary-foreground',
  'pill-soft': 'inline-flex w-fit items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-primary',
}

interface Props {
  variant?: EyebrowVariant
  className?: string
  children: ReactNode
}

export function Eyebrow({ variant = 'text', className, children }: Props) {
  return (
    <p className={cn('text-eyebrow font-semibold uppercase', VARIANT_CLASS[variant], className)}>
      {children}
    </p>
  )
}
