const REFERRAL_STORAGE_KEY = 'overbound-referral'
const REFERRAL_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
/** `?ref=` and not `?code=`: the OAuth callback already uses `code`. */
export const REFERRAL_PARAM = 'ref'

const CODE_PATTERN = /^[A-Za-z0-9_-]{2,40}$/

type StoredReferral = { code: string; capturedAt: string }

const isExpired = (capturedAt: string): boolean => {
  const capturedAtMs = new Date(capturedAt).getTime()
  return Number.isNaN(capturedAtMs) || Date.now() - capturedAtMs > REFERRAL_MAX_AGE_MS
}

/** Link an ambassador shares: the site root with their code, applied at registration. */
export const buildReferralUrl = (origin: string, code: string): string => `${origin}/?${REFERRAL_PARAM}=${encodeURIComponent(code)}`

/**
 * Keeps the `?ref=` code of the landing URL for 30 days, so a friend who comes back later still gets
 * the ambassador's code. Last touch wins. A malformed value is ignored.
 */
export const captureReferralCode = (): void => {
  if (typeof window === 'undefined') return

  const value = new URLSearchParams(window.location.search).get(REFERRAL_PARAM)?.trim()
  if (!value || !CODE_PATTERN.test(value)) return

  const payload: StoredReferral = { code: value.toUpperCase(), capturedAt: new Date().toISOString() }
  try {
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Storage unavailable (private mode, quota): the code can still be typed by hand.
  }
}

export const readReferralCode = (): string | null => {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(REFERRAL_STORAGE_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as StoredReferral
    if (!stored?.code || isExpired(stored.capturedAt)) {
      window.localStorage.removeItem(REFERRAL_STORAGE_KEY)
      return null
    }
    return stored.code
  } catch {
    return null
  }
}

export const clearReferralCode = (): void => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(REFERRAL_STORAGE_KEY)
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
