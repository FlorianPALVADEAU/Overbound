'use client'

import { useEffect, useRef, useState } from 'react'

export interface LuckyWheelTriggerRules {
  delay_ms?: number
  scroll_percent?: number
  exit_intent?: boolean
}

// FDR-0014 §3.1: configurable triggers (time on page, scroll%, exit intent,
// manual CTA). Whichever condition fires first opens the widget -- mirrors
// PopupPromotion's delay pattern (src/components/promotions/PopupPromotion.tsx)
// but adds scroll% and exit intent per the Lucky Wheel spec.
export function useLuckyWheelTrigger({
  rules,
  enabled,
  alreadyTriggered,
}: {
  rules: LuckyWheelTriggerRules
  enabled: boolean
  alreadyTriggered: boolean
}) {
  const [shouldOpen, setShouldOpen] = useState(false)
  const firedRef = useRef(false)

  const openManually = () => {
    if (firedRef.current || alreadyTriggered) return
    firedRef.current = true
    setShouldOpen(true)
  }

  useEffect(() => {
    if (!enabled || alreadyTriggered || firedRef.current) return

    const fire = () => {
      if (firedRef.current) return
      firedRef.current = true
      setShouldOpen(true)
    }

    const timers: ReturnType<typeof setTimeout>[] = []
    const cleanups: (() => void)[] = []

    if (typeof rules.delay_ms === 'number' && rules.delay_ms >= 0) {
      timers.push(setTimeout(fire, rules.delay_ms))
    }

    if (typeof rules.scroll_percent === 'number' && rules.scroll_percent > 0) {
      const onScroll = () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight
        if (scrollable <= 0) return
        const percent = (window.scrollY / scrollable) * 100
        if (percent >= (rules.scroll_percent as number)) {
          fire()
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      cleanups.push(() => window.removeEventListener('scroll', onScroll))
    }

    if (rules.exit_intent) {
      const onMouseLeave = (event: MouseEvent) => {
        if (event.clientY <= 0) fire()
      }
      document.addEventListener('mouseleave', onMouseLeave)
      cleanups.push(() => document.removeEventListener('mouseleave', onMouseLeave))
    }

    return () => {
      timers.forEach(clearTimeout)
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [enabled, alreadyTriggered, rules.delay_ms, rules.scroll_percent, rules.exit_intent])

  return { shouldOpen, openManually, setShouldOpen }
}
