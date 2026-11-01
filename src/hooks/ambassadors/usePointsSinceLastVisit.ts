import { useEffect, useState } from 'react'

const STORAGE_KEY = 'overbound:ambassador:last-seen-points'

/**
 * Points gained since this browser last opened the dashboard. The current total is stored once
 * read, so the message shows on one visit only. Does nothing when `enabled` is false (admin view).
 */
export function usePointsSinceLastVisit(totalPoints: number, enabled: boolean): number {
  const [gain, setGain] = useState(0)

  useEffect(() => {
    if (!enabled) return
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      const previous = stored === null ? null : Number(stored)
      if (previous !== null && Number.isFinite(previous) && totalPoints > previous) setGain(totalPoints - previous)
      window.localStorage.setItem(STORAGE_KEY, String(totalPoints))
    } catch {
      // Storage can be blocked (private mode): the message is a bonus, never an error.
    }
  }, [totalPoints, enabled])

  return gain
}
