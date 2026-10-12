import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Eyebrow, type EyebrowVariant } from './Eyebrow'

/**
 * Eyebrow + title + lead, with the fixed spacing of the design system
 * (docs/design/design-system.md): eyebrow→title mt-2, title→lead mt-3,
 * header→content mb-10 sm:mb-12.
 */
export const DISPLAY_TITLE = 'font-display font-bold uppercase text-balance wrap-break-word'

const TITLE_SIZE = {
  h1: 'text-display-lg',
  h2: 'text-display-md',
} as const

interface Props {
  eyebrow?: ReactNode
  eyebrowVariant?: EyebrowVariant
  title: ReactNode
  lead?: ReactNode
  /** h1 for a page title, h2 (default) for a section title. */
  as?: 'h1' | 'h2'
  align?: 'start' | 'center'
  /** Remove the bottom margin when nothing follows the header. */
  flush?: boolean
  className?: string
}

export function SectionHeader({
  eyebrow,
  eyebrowVariant = 'text',
  title,
  lead,
  as: Heading = 'h2',
  align = 'start',
  flush = false,
  className,
}: Props) {
  const centered = align === 'center'
  return (
    <div className={cn('max-w-2xl', centered && 'mx-auto text-center', !flush && 'mb-10 sm:mb-12', className)}>
      {eyebrow ? (
        <Eyebrow variant={eyebrowVariant} className={cn(centered && eyebrowVariant !== 'text' && 'mx-auto')}>
          {eyebrow}
        </Eyebrow>
      ) : null}
      <Heading className={cn(DISPLAY_TITLE, TITLE_SIZE[Heading], eyebrow && 'mt-2')}>{title}</Heading>
      {lead ? <div className="mt-3 text-lead text-muted-foreground">{lead}</div> : null}
    </div>
  )
}
