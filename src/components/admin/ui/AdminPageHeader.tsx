import type { ReactNode } from 'react'
import { DISPLAY_TITLE, Eyebrow } from '@/components/ds'
import { cn } from '@/lib/utils'

interface AdminPageHeaderProps {
  title: ReactNode
  description?: ReactNode
  /** Small label above the title (the domain: « Billetterie », « Terrain »...). */
  eyebrow?: ReactNode
  /** Primary action(s), right-aligned from md. */
  actions?: ReactNode
  /** h1 (default) for the title of a back-office page, h2 for a block inside a page. */
  as?: 'h1' | 'h2'
  className?: string
}

/** The one title block of the back-office: eyebrow, display title, description, actions. */
export function AdminPageHeader({
  title,
  description,
  eyebrow,
  actions,
  as: Heading = 'h1',
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6', className)}>
      <div className="min-w-0">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Heading className={cn(DISPLAY_TITLE, 'text-display-md', eyebrow && 'mt-2')}>{title}</Heading>
        {description ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
