'use client'

import { useEffect, useState } from 'react'

interface ParallaxOptions {
  /** Max pixel offset from mouse movement, vertical axis. */
  mouseStrength?: number
  /** Max pixel offset from mouse movement, horizontal axis. Kept low: sideways drift reads as violent. */
  mouseStrengthX?: number
  /** Max pixel offset from scroll, applied on Y axis. */
  scrollStrength?: number
  /** Lerp factor per frame toward the target offset (0-1). Lower = smoother trailing. */
  easing?: number
  /** Scale kept on the layer alongside the translation. */
  scale?: number
}

const DEFAULT_OPTIONS: Required<ParallaxOptions> = {
  mouseStrength: 30,
  mouseStrengthX: 6,
  scrollStrength: 120,
  easing: 0.08,
  scale: 1,
}

// Below this distance (px) the layer is considered settled and the loop stops.
const SETTLE_EPSILON = 0.1

/**
 * Parallax background layer driven by mouse position within a container and
 * page scroll. Attach `containerRef` to the section and `layerRef` to the
 * element that moves.
 *
 * The transform is written straight to the layer's style (no React
 * re-render), and the animation frame loop only runs while the container is
 * on screen and the layer is still moving toward its target. Does nothing
 * when the user prefers reduced motion.
 */
export function useParallax(options: ParallaxOptions = {}) {
  const { mouseStrength, mouseStrengthX, scrollStrength, easing, scale } = { ...DEFAULT_OPTIONS, ...options }
  // Callback refs stored in state: the effect re-runs when either element
  // mounts, including sections that render only after their data arrives.
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const [layer, setLayer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!container || !layer) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const current = { x: 0, y: 0 }
    const mouse = { x: 0, y: 0 }
    let scrollOffset = 0
    let visible = false
    let frame: number | null = null

    const apply = () => {
      layer.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) scale(${scale})`
    }

    const tick = () => {
      frame = null
      const targetX = mouse.x
      const targetY = mouse.y + scrollOffset
      current.x += (targetX - current.x) * easing
      current.y += (targetY - current.y) * easing
      apply()
      const settled =
        Math.abs(targetX - current.x) < SETTLE_EPSILON && Math.abs(targetY - current.y) < SETTLE_EPSILON
      if (visible && !settled) frame = requestAnimationFrame(tick)
    }

    const wake = () => {
      if (visible && frame === null) frame = requestAnimationFrame(tick)
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!visible) return
      const rect = container.getBoundingClientRect()
      const relativeX = (event.clientX - rect.left) / rect.width - 0.5
      const relativeY = (event.clientY - rect.top) / rect.height - 0.5
      // Inverted: background drifts opposite the cursor, classic parallax depth cue.
      mouse.x = -relativeX * mouseStrengthX
      mouse.y = -relativeY * mouseStrength
      wake()
    }

    const handleScroll = () => {
      if (!visible) return
      const rect = container.getBoundingClientRect()
      const viewportCenter = window.innerHeight / 2
      const containerCenter = rect.top + rect.height / 2
      scrollOffset = ((containerCenter - viewportCenter) / window.innerHeight) * scrollStrength
      wake()
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting)
      if (visible) handleScroll()
    })
    observer.observe(container)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [container, layer, mouseStrength, mouseStrengthX, scrollStrength, easing, scale])

  return { containerRef: setContainer, layerRef: setLayer }
}
