import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { containerClass } from '@/components/ds'

/** Page column shared by every account screen: one thumb-friendly column on mobile, a wide canvas on desktop. */
export function AccountScreen({
  children,
  className,
  narrow = false,
}: {
  children: ReactNode
  className?: string
  /** Single-purpose screens (claim, forms) stay a readable column on large screens. */
  narrow?: boolean
}) {
  return (
    <div
      className={cn(
        containerClass(narrow ? 'form' : 'page'),
        'pb-10 pt-6 md:pt-8',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Small uppercase label used instead of card titles. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-label font-semibold uppercase text-muted-foreground', className)}>
      {children}
    </p>
  )
}

/** Section separated from the previous one by a hairline, no box. */
export function AccountSection({
  title,
  action,
  children,
  className,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('border-t border-border pt-5', className)}>
      {title || action ? (
        <div className="mb-4 flex items-baseline justify-between gap-4">
          {title ? <Eyebrow>{title}</Eyebrow> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}
