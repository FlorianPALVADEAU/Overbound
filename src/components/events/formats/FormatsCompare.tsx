'use client'

import { useState } from 'react'
import { Heart, Swords } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COMPARE_ROWS, type FormatKey } from './content'

const TABS = [
  { key: 'open', label: 'OPEN', Icon: Heart, active: 'bg-blue-600 text-white' },
  { key: 'ranked', label: 'RANKED', Icon: Swords, active: 'bg-amber-600 text-white' },
] as const

/** Mobile: one format at a time behind a switch. Desktop: both side by side. */
export function FormatsCompare() {
  const [active, setActive] = useState<FormatKey>('open')

  return (
    <>
      <div className="md:hidden">
        <div role="tablist" aria-label="Format" className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
          {TABS.map(({ key, label, Icon, active: activeClass }) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={active === key}
              onClick={() => setActive(key)}
              className={cn(
                'flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-black transition-colors',
                active === key ? activeClass : 'text-muted-foreground',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </button>
          ))}
        </div>
        <dl role="tabpanel" className="mt-4 divide-y divide-border/60">
          {COMPARE_ROWS.map((row) => (
            <div key={row.label} className="py-3.5">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{row.label}</dt>
              <dd className="mt-1 text-base leading-snug">{row[active]}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-border/70 bg-card md:block">
        <div className="grid grid-cols-[10rem_1fr_1fr] border-b border-border/70 text-sm font-black uppercase tracking-wider">
          <div />
          <div className="flex items-center gap-2 bg-blue-500/10 px-5 py-4 text-blue-600">
            <Heart className="h-4 w-4" aria-hidden /> OPEN
          </div>
          <div className="flex items-center gap-2 bg-amber-500/10 px-5 py-4 text-amber-600">
            <Swords className="h-4 w-4" aria-hidden /> RANKED
          </div>
        </div>
        {COMPARE_ROWS.map((row) => (
          <div key={row.label} className="grid grid-cols-[10rem_1fr_1fr] border-b border-border/50 last:border-b-0">
            <div className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{row.label}</div>
            <div className="px-5 py-4 text-sm">{row.open}</div>
            <div className="px-5 py-4 text-sm">{row.ranked}</div>
          </div>
        ))}
      </div>
    </>
  )
}
