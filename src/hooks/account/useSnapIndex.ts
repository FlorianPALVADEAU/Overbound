'use client'

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

const DRAG_THRESHOLD_PX = 6

/**
 * Scroll-snap row helpers: which child is centred (for a "2 / 5" counter) and
 * mouse drag-to-scroll, since a mouse cannot swipe a native scroller.
 */
export function useSnapIndex() {
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const drag = useRef<{ startX: number; startScroll: number; moved: boolean } | null>(null)

  const onScroll = useCallback(() => {
    const row = ref.current
    if (!row || row.children.length === 0) return
    const center = row.scrollLeft + row.clientWidth / 2
    let closest = 0
    let smallestGap = Number.POSITIVE_INFINITY
    Array.from(row.children).forEach((child, childIndex) => {
      const element = child as HTMLElement
      const gap = Math.abs(element.offsetLeft + element.offsetWidth / 2 - center)
      if (gap < smallestGap) {
        smallestGap = gap
        closest = childIndex
      }
    })
    setIndex(closest)
  }, [])

  const scrollTo = useCallback((target: number) => {
    const child = ref.current?.children[target] as HTMLElement | undefined
    child?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [])

  const endDrag = useCallback(() => {
    const row = ref.current
    if (!drag.current || !row) return
    row.style.scrollSnapType = ''
    row.style.cursor = ''
    // Keep `moved` readable for the click that follows the release, then clear it.
    setTimeout(() => {
      drag.current = null
    }, 0)
  }, [])

  const dragHandlers = {
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || !ref.current) return
      drag.current = { startX: event.clientX, startScroll: ref.current.scrollLeft, moved: false }
    },
    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => {
      const row = ref.current
      const state = drag.current
      if (!row || !state) return
      const delta = event.clientX - state.startX
      if (!state.moved && Math.abs(delta) < DRAG_THRESHOLD_PX) return
      state.moved = true
      // Snapping would fight the drag; it is restored on release.
      row.style.scrollSnapType = 'none'
      row.style.cursor = 'grabbing'
      row.scrollLeft = state.startScroll - delta
    },
    onPointerUp: endDrag,
    onPointerLeave: endDrag,
    onPointerCancel: endDrag,
    // A drag must not "click" the bib button under the cursor on release.
    onClickCapture: (event: React.MouseEvent<HTMLDivElement>) => {
      if (drag.current?.moved) {
        event.preventDefault()
        event.stopPropagation()
      }
    },
  }

  return { ref, index, onScroll, scrollTo, dragHandlers }
}
