import type { ReactNode } from 'react'
import { Eyebrow } from '@/components/account/AccountScreen'

export function Kpi({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div>
      <p className="text-4xl font-black leading-none tracking-tighter tabular-nums md:text-5xl">{value}</p>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    </div>
  )
}

export function ChartBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border pt-5">
      <Eyebrow className="mb-4">{title}</Eyebrow>
      {children}
    </section>
  )
}

export function SectionHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string | null }) {
  return (
    <header className="mb-6">
      <Eyebrow className="text-primary">{eyebrow}</Eyebrow>
      <h2 className="mt-1 text-balance text-3xl font-black leading-tight tracking-tight md:text-4xl">{title}</h2>
      {detail ? <p className="mt-1 text-sm text-muted-foreground first-letter:uppercase">{detail}</p> : null}
    </header>
  )
}

export const TIMING_HINT = 'Disponible dès que le chronométrage officiel sera branché sur ton compte.'
