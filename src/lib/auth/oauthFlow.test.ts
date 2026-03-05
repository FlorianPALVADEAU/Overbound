import { describe, expect, it } from 'vitest'
import { buildExternalOAuthUrl, shouldAutoStartGoogleOAuth } from './oauthFlow'

describe('shouldAutoStartGoogleOAuth', () => {
  it('returns true only when oauth=google and browser is not in-app', () => {
    const shouldStart = shouldAutoStartGoogleOAuth({
      oauthParam: 'google',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
      alreadyTriggered: false,
    })

    expect(shouldStart).toBe(true)
  })

  it('returns false for in-app browsers', () => {
    const shouldStart = shouldAutoStartGoogleOAuth({
      oauthParam: 'google',
      userAgent: 'Mozilla/5.0 Instagram 300.0.0',
      alreadyTriggered: false,
    })

    expect(shouldStart).toBe(false)
  })

  it('returns false when already triggered or wrong provider', () => {
    expect(
      shouldAutoStartGoogleOAuth({
        oauthParam: 'google',
        userAgent: 'Mozilla/5.0 Chrome/122',
        alreadyTriggered: true,
      }),
    ).toBe(false)

    expect(
      shouldAutoStartGoogleOAuth({
        oauthParam: 'facebook',
        userAgent: 'Mozilla/5.0 Chrome/122',
        alreadyTriggered: false,
      }),
    ).toBe(false)
  })
})

describe('buildExternalOAuthUrl', () => {
  it('adds oauth=google while preserving existing query params', () => {
    const url = buildExternalOAuthUrl(
      'https://www.overbound-race.com/auth/login?next=%2Faccount&source=ig',
      'google',
    )

    expect(url).toBe(
      'https://www.overbound-race.com/auth/login?next=%2Faccount&source=ig&oauth=google',
    )
  })
})
