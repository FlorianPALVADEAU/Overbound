'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Sticky only while the element fits in the viewport. A sticky column taller
 * than the screen either hides its bottom or needs its own scrollbar; past that
 * height it simply scrolls with the page.
 */
export function useStickyWhenFits<T extends HTMLElement>(topOffsetPx: number) {
  const ref = useRef<T>(null)
  const [fits, setFits] = useState(true)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => setFits(element.offsetHeight + topOffsetPx * 2 <= window.innerHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [topOffsetPx])

  return { ref, fits }
}
