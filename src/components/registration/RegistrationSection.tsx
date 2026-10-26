import type { ReactNode, Ref } from 'react'
import { Check } from 'lucide-react'
import { DISPLAY_TITLE } from '@/components/ds'
import { cn } from '@/lib/utils'

interface RegistrationSectionProps {
  index: number
  title: string
  isComplete?: boolean
  optional?: boolean
  children: ReactNode
  sectionRef?: Ref<HTMLElement>
}

/**
 * One step of the checkout. Flat on purpose: a numbered title and the content
 * straight on the page, so the only boxes the visitor sees are the ones that
 * mean something (a ticket, a participant).
 */
export default function RegistrationSection({
  index,
  title,
  isComplete = false,
  optional = false,
  children,
  sectionRef,
}: RegistrationSectionProps) {
  return (
    <section ref={sectionRef} className="scroll-mt-24 py-6 first:pt-0">
      <header className="mb-3 flex items-center gap-3">
        <span
          aria-hidden
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
            isComplete ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          {isComplete ? <Check className="h-4 w-4" /> : index}
        </span>
        <h2 className={cn(DISPLAY_TITLE, 'text-title')}>{title}</h2>
        {optional ? <span className="text-sm text-subtle">Facultatif</span> : null}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
