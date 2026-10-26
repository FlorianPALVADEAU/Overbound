'use client'

import { useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrderDetailsToggleProps {
  children: ReactNode
  /** Number of lines hidden, to tell the visitor what a click reveals. */
  lineCount: number
}

/** Folds the full order: the summary stays short however many people are registered. */
export default function OrderDetailsToggle({ children, lineCount }: OrderDetailsToggleProps) {
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl text-sm font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {open ? 'Masquer le détail' : `Voir le détail (${lineCount} ligne${lineCount > 1 ? 's' : ''})`}
        <ChevronDown aria-hidden className={cn('size-4 transition-transform duration-200 ease-standard', open && 'rotate-180')} />
      </button>
      <div id={bodyId} hidden={!open} className="mt-2 max-h-80 overflow-y-auto pr-1">
        {children}
      </div>
    </div>
  )
}
