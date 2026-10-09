import type { ReactNode } from 'react'
import { SparklesIcon } from 'lucide-react'

interface ComingSoonProps {
  title: string
  hint: string
  children: ReactNode
}

/**
 * Teases a chart whose data does not exist yet: the sample chart is blurred
 * and hidden from assistive tech, and a clear "Bientôt" label sits on top.
 */
export function ComingSoon({ title, hint, children }: ComingSoonProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-border">
      <div aria-hidden className="pointer-events-none select-none p-4 opacity-90 blur-[5px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/25 px-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary ring-1 ring-primary/30">
          <SparklesIcon className="size-3" />
          Bientôt
        </span>
        <p className="text-base font-bold leading-tight">{title}</p>
        <p className="max-w-[16rem] text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  )
}
