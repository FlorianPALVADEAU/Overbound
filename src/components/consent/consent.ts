export const CONSENT_STORAGE_KEY = 'overbound-consent'
export const CONSENT_EVENT = 'overbound:consent'

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

export const readConsent = (): ConsentState | null => {
  if (typeof window === 'undefined') return null
  return safeParse(window.localStorage.getItem(CONSENT_STORAGE_KEY))
}

export const writeConsent = (analytics: boolean) => {
  if (typeof window === 'undefined') return
  const payload: ConsentState = {
    analytics,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload))
  window.dispatchEvent(new Event(CONSENT_EVENT))
}

export const clearConsent = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CONSENT_STORAGE_KEY)
  window.dispatchEvent(new Event(CONSENT_EVENT))
}
