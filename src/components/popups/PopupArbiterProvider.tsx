'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

// FDR-0015 §7.3 layer 1: at most one automatic popup per session. Two
// components can each satisfy their own trigger (delay/scroll%/exit intent)
// in the same page load; without this, both would open simultaneously.
// First component whose trigger fires claims the slot; the slot is never
// released once claimed, matching "one popup per session" rather than
// per-page. The Lucky Wheel is the stronger capture mechanism and should
// be preferred when both triggers are configured to fire near-simultaneously;
// callers mount LuckyWheelWidget's trigger check before PopupPromotion's in
// the component tree so a same-tick race favors it.
//
// Blocking overlays (cookie banner) hold the arbiter shut while visible: no
// popup may open until they are dismissed, so a visitor never sees the
// consent banner and a popup stacked together (UX simulation 2026-10-27).
// Releasing the block changes requestSlot's identity, which re-runs the
// callers' effects and lets a popup whose trigger already fired open then.
type PopupKey = 'lucky-wheel' | 'marketing-popup'

interface PopupArbiterContextValue {
  requestSlot: (key: PopupKey) => boolean
  registerBlocker: () => () => void
}

const PopupArbiterContext = createContext<PopupArbiterContextValue | null>(null)

export function PopupArbiterProvider({ children }: { children: ReactNode }) {
  const heldByRef = useRef<PopupKey | null>(null)
  const [blockerCount, setBlockerCount] = useState(0)

  const requestSlot = useCallback(
    (key: PopupKey) => {
      if (blockerCount > 0) return false
      if (heldByRef.current === null) {
        heldByRef.current = key
        return true
      }
      return heldByRef.current === key
    },
    [blockerCount],
  )

  const registerBlocker = useCallback(() => {
    setBlockerCount((count) => count + 1)
    return () => setBlockerCount((count) => Math.max(0, count - 1))
  }, [])

  const value = useMemo(() => ({ requestSlot, registerBlocker }), [requestSlot, registerBlocker])

  return <PopupArbiterContext.Provider value={value}>{children}</PopupArbiterContext.Provider>
}

/**
 * A component ready to open its automatic popup calls this with its own key
 * right before flipping its own isOpen state to true. Returns true if this
 * component may proceed, false if another popup already holds the
 * session's one slot.
 */
export function usePopupSlot(key: PopupKey) {
  const context = useContext(PopupArbiterContext)
  if (!context) {
    throw new Error('usePopupSlot must be used within a PopupArbiterProvider')
  }
  return context.requestSlot
}

/**
 * An overlay that must be dismissed before any automatic popup opens (the
 * cookie banner) calls this with its own visibility. Outside a provider it
 * is a no-op so the overlay still renders in isolation.
 */
export function useBlockingOverlay(active: boolean) {
  const context = useContext(PopupArbiterContext)
  const registerBlocker = context?.registerBlocker
  useEffect(() => {
    if (!active || !registerBlocker) return
    return registerBlocker()
  }, [active, registerBlocker])
}
