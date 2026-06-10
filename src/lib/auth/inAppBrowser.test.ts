import { describe, expect, it } from 'vitest'
import { buildExternalBrowserUrl, detectInAppBrowser, isInAppBrowser } from './inAppBrowser'

describe('detectInAppBrowser', () => {
  it('detects Instagram, Snapchat and Facebook webviews', () => {
    expect(detectInAppBrowser('Mozilla/5.0 Instagram 300.0.0')).toBe('instagram')
    expect(detectInAppBrowser('Mozilla/5.0 Snapchat/12.0.0')).toBe('snapchat')
    expect(detectInAppBrowser('Mozilla/5.0 FBAN/FBIOS;FBAV/450.0.0.0.0')).toBe('facebook')
  })

  it('detects generic in-app webviews', () => {
    expect(detectInAppBrowser('Mozilla/5.0 (Linux; Android 14; Pixel) AppleWebKit/537.36; wv)')).toBe(
      'unknown_inapp',
    )
  })

  it('returns regular_browser for classic user agents', () => {
    expect(
      detectInAppBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
      ),
    ).toBe('regular_browser')
    expect(isInAppBrowser('Mozilla/5.0 Chrome/122.0.0.0 Safari/537.36')).toBe(false)
  })
})

describe('buildExternalBrowserUrl', () => {
  it('builds an Android intent url targeting the default browser (no package)', () => {
    const url = buildExternalBrowserUrl(
      'https://www.overbound-race.com/auth/login?oauth=google',
      'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
    )
    expect(url).toBe(
      'intent://www.overbound-race.com/auth/login?oauth=google#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end',
    )
  })

  it('returns the plain url for iOS (caller uses window.open for the prompt)', () => {
    const url = buildExternalBrowserUrl(
      'https://www.overbound-race.com/auth/register?oauth=google',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
    )
    expect(url).toBe('https://www.overbound-race.com/auth/register?oauth=google')
  })

  it('falls back to current url for other platforms', () => {
    const current = 'https://www.overbound-race.com/auth/login'
    expect(buildExternalBrowserUrl(current, 'Mozilla/5.0 (X11; Linux x86_64)')).toBe(current)
  })
})
