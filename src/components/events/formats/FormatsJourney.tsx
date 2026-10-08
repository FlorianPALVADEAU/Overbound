import { cn } from '@/lib/utils'
import type { JourneyStep } from './content'

interface Props {
  title: string
  tone: 'open' | 'ranked'
  steps: JourneyStep[]
}

const TONE = {
  open: { text: 'text-blue-600', dot: 'bg-blue-500', border: 'border-blue-500/30' },
  ranked: { text: 'text-amber-600', dot: 'bg-amber-500', border: 'border-amber-500/30' },
}

export function FormatsJourney({ title, tone, steps }: Props) {
  const t = TONE[tone]
  return (
    <div className={cn('rounded-2xl border bg-card p-6', t.border)}>
      <h3 className={cn('text-xl font-black', t.text)}>{title}</h3>
      <ol className="mt-5 space-y-5 border-l border-border/70 pl-6">
        {steps.map((step) => (
          <li key={step.title} className="relative">
            <span className={cn('absolute -left-[1.9rem] top-1.5 h-2.5 w-2.5 rounded-full', t.dot)} />
            <p className={cn('text-xs font-bold uppercase tracking-wider', t.text)}>{step.time}</p>
            <p className="mt-0.5 font-semibold">{step.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{step.text}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
