import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Row of key figures (date, place, price, spots...), from the event hero
 * (docs/design/design-system.md). Label in text-label, value in display face.
 */
export interface Stat {
  label: string
  value: ReactNode
  /** Small uppercase unit after the value (e.g. "places", "sept. 2026"). */
  unit?: ReactNode
  /** Primary color for the value (price). */
  highlight?: boolean
}

interface Props {
  stats: Stat[]
  /** Denser cells for back-office screens and phones. */
  compact?: boolean
  className?: string
}

export function StatRow({ stats, compact = false, className }: Props) {
  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border',
        stats.length >= 4 ? 'lg:grid-cols-4' : stats.length === 3 ? 'lg:grid-cols-3' : '',
        className,
      )}
    >
      {stats.map(({ label, value, unit, highlight }) => (
        <div key={label} className="flex min-w-0 flex-col gap-2 bg-background p-4 sm:p-6">
          <dt className="text-label font-semibold uppercase text-subtle">{label}</dt>
          <dd className="min-w-0">
            <span className={cn('font-display font-bold leading-none', compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl', highlight && 'text-primary')}>
              {value}
            </span>
            {unit ? <span className="ml-2 text-sm font-semibold uppercase">{unit}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}
