export const CONSENT_STORAGE_KEY = 'overbound-consent'
export const CONSENT_EVENT = 'overbound:consent'

// CNIL recommande un re-consentement périodique (6-13 mois) plutôt qu'un
// consentement valable indéfiniment. 12 mois retenu ici (FDR-0009 §2.6).
const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000

export type ConsentState = {
  analytics: boolean
  updatedAt: string
}

const safeParse = (value: string | null) => {
  if (!value) return null
  try {
    return JSON.parse(value) as ConsentState
  } catch {
    return null
  }
}

const isExpired = (consent: ConsentState): boolean => {
  const updatedAt = new Date(consent.updatedAt).getTime()
  if (Number.isNaN(updatedAt)) return true
  return Date.now() - updatedAt > CONSENT_MAX_AGE_MS
}

export const readConsent = (): ConsentState | null => {
  if (typeof window === 'undefined') return null
  const consent = safeParse(window.localStorage.getItem(CONSENT_STORAGE_KEY))
  if (!consent) return null
  if (isExpired(consent)) {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY)
    return null
  }
  return consent
}

export const writeConsent = (analytics: boolean) => {
  if (typeof window === 'undefined') return
  const payload: ConsentState = {
    analytics,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload))
  window.dispatchEvent(new Event(CONSENT_EVENT))

  fetch('/api/consent/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analyticsAccepted: analytics }),
    keepalive: true,
  }).catch(() => {
    // Best-effort server-side proof; never block the banner on network failure.
  })
}

export const clearConsent = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CONSENT_STORAGE_KEY)
  window.dispatchEvent(new Event(CONSENT_EVENT))
}
