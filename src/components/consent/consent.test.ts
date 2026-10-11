import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CONSENT_STORAGE_KEY, readConsent, writeConsent } from './consent'

beforeEach(() => {
  window.localStorage.clear()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
})

describe('consent storage', () => {
  it('stores audience and marketing choices independently', () => {
    writeConsent({ analytics: true, marketing: false })

    expect(readConsent()).toMatchObject({ analytics: true, marketing: false })
  })

  it('asks again when the stored choice predates the audience/marketing split', () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ analytics: true, updatedAt: new Date().toISOString() }),
    )

    expect(readConsent()).toBeNull()
  })

  it('asks again after 12 months', () => {
    const thirteenMonthsAgo = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString()
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ analytics: true, marketing: true, updatedAt: thirteenMonthsAgo }),
    )

    expect(readConsent()).toBeNull()
  })

  it('logs both purposes server-side', () => {
    writeConsent({ analytics: false, marketing: true })

    expect(fetch).toHaveBeenCalledWith(
      '/api/consent/log',
      expect.objectContaining({ body: JSON.stringify({ analyticsAccepted: false, marketingAccepted: true }) }),
    )
  })
})
