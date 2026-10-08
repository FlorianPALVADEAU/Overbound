import { useEffect } from 'react'
import type { CarouselApi } from '@/components/ui/carousel'

interface Options {
  /** Stop the rotation, e.g. while a video plays. */
  paused?: boolean
}

/**
 * Advances an embla carousel every `intervalMs`. It only runs while the slider
 * is on screen and the tab is visible, stops while the user hovers, touches or
 * focuses it, never runs under prefers-reduced-motion, and rewinds to the first
 * slide at the end of a non-looping carousel.
 */
export function useCarouselAutoplay(
  api: CarouselApi | undefined | null,
  intervalMs: number | undefined,
  { paused = false }: Options = {},
) {
  useEffect(() => {
    if (!api || !intervalMs || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const root = api.rootNode()
    let visible = false
    let interacting = false

    const tick = () => {
      if (!visible || interacting || document.hidden) return
      if (api.canScrollNext()) api.scrollNext()
      else api.scrollTo(0)
    }
    const timer = window.setInterval(tick, intervalMs)

    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting)
    }, { threshold: 0.3 })
    observer.observe(root)

    const hold = () => { interacting = true }
    const release = () => { interacting = false }
    root.addEventListener('pointerenter', hold)
    root.addEventListener('pointerleave', release)
    root.addEventListener('pointerdown', hold)
    root.addEventListener('focusin', hold)
    root.addEventListener('focusout', release)
    // After a touch drag the finger is up: resume once the slider settles.
    api.on('settle', release)

    return () => {
      window.clearInterval(timer)
      observer.disconnect()
      root.removeEventListener('pointerenter', hold)
      root.removeEventListener('pointerleave', release)
      root.removeEventListener('pointerdown', hold)
      root.removeEventListener('focusin', hold)
      root.removeEventListener('focusout', release)
      api.off('settle', release)
    }
  }, [api, intervalMs, paused])
}
