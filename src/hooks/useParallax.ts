'use client'

import { useEffect, useRef, useState } from 'react'

interface ParallaxOptions {
  /** Max pixel offset from mouse movement, vertical axis. */
  mouseStrength?: number
  /** Max pixel offset from mouse movement, horizontal axis. Kept low: sideways drift reads as violent. */
  mouseStrengthX?: number
  /** Max pixel offset from scroll, applied on Y axis. */
  scrollStrength?: number
  /** Lerp factor per frame toward the target offset (0-1). Lower = smoother trailing. */
  easing?: number
}

interface ParallaxOffset {
  x: number
  y: number
}

const DEFAULT_OPTIONS: Required<ParallaxOptions> = {
  mouseStrength: 30,
  mouseStrengthX: 6,
  scrollStrength: 120,
  easing: 0.08,
}

/**
 * Tracks mouse position within a container and page scroll, combining both
 * into a single translate offset for a parallax background layer.
 * No-ops (returns {x:0, y:0}) when the user prefers reduced motion.
 */
export function useParallax(
  containerRef: React.RefObject<HTMLElement | null>,
  options: ParallaxOptions = {}
): ParallaxOffset {
  const { mouseStrength, mouseStrengthX, scrollStrength, easing } = { ...DEFAULT_OPTIONS, ...options }
  const [offset, setOffset] = useState<ParallaxOffset>({ x: 0, y: 0 })
  const targetRef = useRef<ParallaxOffset>({ x: 0, y: 0 })
  const currentRef = useRef<ParallaxOffset>({ x: 0, y: 0 })
  const mouseOffsetRef = useRef<ParallaxOffset>({ x: 0, y: 0 })
  const scrollOffsetRef = useRef(0)
  const frameRef = useRef<number | null>(null)
  // containerRef.current mutates without triggering a re-render, so a plain
  // useEffect keyed on the ref object would never re-run once the element
  // mounts after an initially-null render. Poll a couple of animation
  // frames to catch that attach, then proceed as normal.
  const [containerReady, setContainerReady] = useState(false)

  useEffect(() => {
    if (containerRef.current) {
      setContainerReady(true)
      return
    }
    let frame: number
    const check = () => {
      if (containerRef.current) {
        setContainerReady(true)
        return
      }
      frame = requestAnimationFrame(check)
    }
    frame = requestAnimationFrame(check)
    return () => cancelAnimationFrame(frame)
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const tick = () => {
      targetRef.current = {
        x: mouseOffsetRef.current.x,
        y: mouseOffsetRef.current.y + scrollOffsetRef.current,
      }
      currentRef.current = {
        x: currentRef.current.x + (targetRef.current.x - currentRef.current.x) * easing,
        y: currentRef.current.y + (targetRef.current.y - currentRef.current.y) * easing,
      }
      setOffset({ x: currentRef.current.x, y: currentRef.current.y })
      frameRef.current = requestAnimationFrame(tick)
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const relativeX = (event.clientX - rect.left) / rect.width - 0.5
      const relativeY = (event.clientY - rect.top) / rect.height - 0.5
      // Inverted: background drifts opposite the cursor, classic parallax depth cue.
      mouseOffsetRef.current = {
        x: -relativeX * mouseStrengthX,
        y: -relativeY * mouseStrength,
      }
    }

    const handleScroll = () => {
      const rect = container.getBoundingClientRect()
      const viewportCenter = window.innerHeight / 2
      const containerCenter = rect.top + rect.height / 2
      const distanceFromCenter = (containerCenter - viewportCenter) / window.innerHeight
      scrollOffsetRef.current = distanceFromCenter * scrollStrength
    }

    handleScroll()
    frameRef.current = requestAnimationFrame(tick)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [containerRef, containerReady, mouseStrength, mouseStrengthX, scrollStrength, easing])

  return offset
}
