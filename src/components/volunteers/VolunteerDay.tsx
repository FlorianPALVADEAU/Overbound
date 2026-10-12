'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Container, Section, SectionHeader, DISPLAY_TITLE } from '@/components/ds'

const STEPS = [
  { time: 'Au départ', title: 'Brief', description: 'Équipement, répartition des postes, consignes.' },
  { time: 'Pendant la course', title: 'Ton poste', description: 'Tu encourages, tu sécurises, tu aides les coureurs.' },
  { time: 'À la fin', title: 'Débrief', description: 'Remerciements et goodies.' },
] as const

export function VolunteerDay() {
  const stepRefs = useRef<(HTMLLIElement | null)[]>([])
  const [reached, setReached] = useState(-1)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const index = Number((entry.target as HTMLElement).dataset.index)
          setReached((current) => Math.max(current, index))
        })
      },
      { rootMargin: '0px 0px -35% 0px', threshold: 0.2 },
    )
    stepRefs.current.forEach((node) => node && observer.observe(node))
    return () => observer.disconnect()
  }, [])

  return (
    <Section tone="deep">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-20">
        <SectionHeader
          flush
          eyebrow="Ta journée"
          title="Le déroulé"
          className="lg:sticky lg:top-28 lg:self-start"
        />

        <ol className="relative space-y-8 pl-10">
          <span className="absolute bottom-2 left-[15px] top-2 w-0.5 bg-white/10" aria-hidden />
          <span
            className="absolute left-[15px] top-2 w-0.5 origin-top bg-primary transition-transform duration-700 motion-reduce:transition-none"
            style={{
              bottom: '0.5rem',
              transform: `scaleY(${reached < 0 ? 0 : (reached + 1) / STEPS.length})`,
            }}
            aria-hidden
          />
          {STEPS.map((step, index) => {
            const active = index <= reached
            return (
              <li
                key={step.title}
                ref={(node) => {
                  stepRefs.current[index] = node
                }}
                data-index={index}
                className={cn(
                  'relative rounded-2xl border p-5 transition-all duration-500 motion-reduce:transition-none sm:p-6',
                  active ? 'border-primary/50 bg-primary/5' : 'border-white/10 bg-white/5 opacity-60',
                )}
              >
                <span
                  className={cn(
                    'absolute -left-10 top-6 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors duration-500 motion-reduce:transition-none',
                    active ? 'border-primary bg-primary text-primary-foreground' : 'border-white/20 bg-background text-white/60',
                  )}
                  aria-hidden
                >
                  {index + 1}
                </span>
                <p className="text-label font-semibold uppercase text-primary">{step.time}</p>
                <h3 className={cn(DISPLAY_TITLE, 'mt-1 text-title')}>{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </li>
            )
          })}
        </ol>
      </Container>
    </Section>
  )
}
