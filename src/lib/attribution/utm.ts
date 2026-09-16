const UTM_STORAGE_KEY = 'overbound-utm'
const UTM_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const

export type UtmParams = Partial<Record<(typeof UTM_PARAMS)[number], string>>

type StoredUtm = { params: UtmParams; capturedAt: string }

const isExpired = (capturedAt: string): boolean => {
  const capturedAtMs = new Date(capturedAt).getTime()
  if (Number.isNaN(capturedAtMs)) return true
  return Date.now() - capturedAtMs > UTM_MAX_AGE_MS
}

/**
 * Captures UTM query params from the current URL into localStorage on first
 * touch, so they survive across pages until the registration funnel is
 * completed (a paid ad visitor rarely converts on their first landing).
 * A later visit with new UTM params overwrites the stored ones (last touch).
 */
export const captureUtmParams = (): void => {
  if (typeof window === 'undefined') return

  const searchParams = new URLSearchParams(window.location.search)
  const params: UtmParams = {}
  for (const key of UTM_PARAMS) {
    const value = searchParams.get(key)
    if (value) params[key] = value
  }

  if (Object.keys(params).length === 0) return

  const payload: StoredUtm = { params, capturedAt: new Date().toISOString() }
  try {
    window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Storage unavailable (private mode, quota) — attribution is best-effort.
  }
}

/**
 * Validates and flattens untrusted UTM params (e.g. from a request body) into
 * a single comma-free string safe to store as Stripe metadata (500 char
 * limit per value; Stripe metadata values must be strings).
 */
export const serializeUtmParams = (value: unknown): string => {
  if (!value || typeof value !== 'object') return ''

  const entries: string[] = []
  for (const key of UTM_PARAMS) {
    const raw = (value as Record<string, unknown>)[key]
    if (typeof raw !== 'string') continue
    const sanitized = raw.trim().slice(0, 200)
    if (sanitized.length === 0) continue
    entries.push(`${key}=${encodeURIComponent(sanitized)}`)
  }

  return entries.join('&')
}

export const readUtmParams = (): UtmParams | null => {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(UTM_STORAGE_KEY)
    if (!raw) return null

    const stored = JSON.parse(raw) as StoredUtm
    if (!stored?.params || isExpired(stored.capturedAt)) {
      window.localStorage.removeItem(UTM_STORAGE_KEY)
      return null
    }

    return stored.params
  } catch {
    return null
  }
}
