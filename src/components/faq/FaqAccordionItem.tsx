'use client'

import { useId, useState, type ReactNode } from 'react'
import { ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  children: ReactNode
}

/**
 * One question of the site FAQ: the card of the homepage, reused wherever a FAQ appears.
 * The answer stays in the HTML while closed (hidden), so crawlers and assistants read it.
 */
export function FaqAccordionItem({ title, children }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()

  return (
    <div
      className={cn(
        'w-full rounded-2xl border p-6 transition-colors duration-300 ease-standard hover:border-foreground/40',
        isOpen ? 'border-primary/70 bg-card/60 shadow-lg shadow-primary/10 hover:border-primary' : 'border-border bg-transparent',
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 text-left"
      >
        <h3 className="text-lg font-semibold text-foreground sm:text-xl">{title}</h3>
        <ArrowDown
          className={cn(
            'h-6 w-6 shrink-0 text-muted-foreground transition-transform duration-300 hover:text-primary',
            isOpen ? 'rotate-180 text-primary' : 'rotate-0',
          )}
          aria-hidden="true"
        />
      </button>
      <div id={panelId} hidden={!isOpen} className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {children}
      </div>
    </div>
  )
}
