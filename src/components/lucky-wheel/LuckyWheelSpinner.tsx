'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface LuckyWheelSpinnerProps {
  spinning: boolean
  onAnimationComplete: () => void
}

// FDR-0014 §3.3/§17: the result is already known server-side before this
// component even mounts (spinLuckyWheel already resolved) -- this only
// plays a 2-4s animation so it doesn't feel instant, then reveals the
// result screen. Respects prefers-reduced-motion by skipping straight to
// the result (spec §17: reduced-motion support).
export function LuckyWheelSpinner({ spinning, onAnimationComplete }: LuckyWheelSpinnerProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(query.matches)
    const listener = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [])

  useEffect(() => {
    if (!spinning) return

    const durationMs = prefersReducedMotion ? 200 : 3000
    const timer = setTimeout(onAnimationComplete, durationMs)
    return () => clearTimeout(timer)
  }, [spinning, prefersReducedMotion, onAnimationComplete])

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      <div
        className={`relative flex h-48 w-48 items-center justify-center rounded-full border-8 border-primary/20 ${
          prefersReducedMotion ? '' : 'animate-spin'
        }`}
        style={prefersReducedMotion ? undefined : { animationDuration: '0.6s' }}
        role="status"
        aria-live="polite"
        aria-label="Tirage en cours"
      >
        <div className="h-16 w-16 rounded-full bg-primary" />
      </div>
      <p className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        La roue tourne…
      </p>
    </div>
  )
}
