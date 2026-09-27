'use client'

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react'

// FDR-0015 §7.3 layer 1: at most one automatic popup per session. Two
// components can each satisfy their own trigger (delay/scroll%/exit intent)
// in the same page load; without this, both would open simultaneously.
// First component whose trigger fires claims the slot; the slot is never
// released once claimed, matching "one popup per session" rather than
// per-page. The Lucky Wheel is the stronger capture mechanism and should
// be preferred when both triggers are configured to fire near-simultaneously;
// callers mount LuckyWheelWidget's trigger check before PopupPromotion's in
// the component tree so a same-tick race favors it.
type PopupKey = 'lucky-wheel' | 'marketing-popup'

interface PopupArbiterContextValue {
  requestSlot: (key: PopupKey) => boolean
}

const PopupArbiterContext = createContext<PopupArbiterContextValue | null>(null)

export function PopupArbiterProvider({ children }: { children: ReactNode }) {
  const heldByRef = useRef<PopupKey | null>(null)

  const requestSlot = useCallback((key: PopupKey) => {
    if (heldByRef.current === null) {
      heldByRef.current = key
      return true
    }
    return heldByRef.current === key
  }, [])

  const value = useMemo(() => ({ requestSlot }), [requestSlot])

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
