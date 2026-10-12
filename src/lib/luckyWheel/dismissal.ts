// A visitor who closes the wheel without playing must not see it again on the
// next page or the next visit for a while. localStorage (not sessionStorage)
// so the pause also survives a new tab or a return visit.
export const WHEEL_DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

const dismissKey = (eventId: string) => `overbound-lucky-wheel-dismissed-${eventId}`

export function isWheelDismissed(eventId: string, now = Date.now()): boolean {
  try {
    const raw = localStorage.getItem(dismissKey(eventId))
    const dismissedAt = raw ? Number(raw) : NaN
    return Number.isFinite(dismissedAt) && now - dismissedAt < WHEEL_DISMISS_COOLDOWN_MS
  } catch {
    return false
  }
}

export function markWheelDismissed(eventId: string, now = Date.now()): void {
  try {
    localStorage.setItem(dismissKey(eventId), String(now))
  } catch {
    // Private mode: the popup may come back, never block the page.
  }
}
