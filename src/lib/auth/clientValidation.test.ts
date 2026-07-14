import { describe, expect, it } from 'vitest'
import {
  AUTH_CONFIG_ERROR_MESSAGE,
  buildAuthCallbackUrl,
  isValidEmail,
  mapRegisterAuthErrorMessage,
  mapOAuthCallbackErrorMessage,
  mapResendConfirmationErrorMessage,
  registerValidationErrorMessage,
  resolveAuthBaseUrl,
  resolveSafeNextPath,
  validateRegisterInput,
} from './clientValidation'

describe('isValidEmail', () => {
  it('accepts valid email formats', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('john.doe+race@sub.domain.fr')).toBe(true)
  })

  it('rejects malformed emails', () => {
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('@domain.com')).toBe(false)
  })
})

describe('resolveSafeNextPath', () => {
  it('returns /account by default', () => {
    expect(resolveSafeNextPath(null)).toBe('/account')
    expect(resolveSafeNextPath(undefined)).toBe('/account')
    expect(resolveSafeNextPath('https://evil.com')).toBe('/account')
  })

  it('keeps internal paths', () => {
    expect(resolveSafeNextPath('/account')).toBe('/account')
    expect(resolveSafeNextPath('/events/abc/register')).toBe('/events/abc/register')
  })
})

describe('resolveAuthBaseUrl and buildAuthCallbackUrl', () => {
  it('prefers the canonical env site URL over the runtime origin, and trims trailing slash', () => {
    // OAuth must start and finish on the same host: middleware redirects any
    // non-canonical host to NEXT_PUBLIC_SITE_URL before the callback route
    // can exchange the PKCE code, so the runtime origin (e.g. apex domain,
    // preview domain) must never win over the canonical env URL here.
    const base = resolveAuthBaseUrl('https://overbound-race.com/', 'https://www.overbound-race.com')
    expect(base).toBe('https://www.overbound-race.com')
  })

  it('falls back to runtime origin when no env url is configured', () => {
    const base = resolveAuthBaseUrl('https://overbound-race.com/', undefined)
    expect(base).toBe('https://overbound-race.com')
  })

  it('returns null when no base is available', () => {
    expect(resolveAuthBaseUrl(undefined, undefined)).toBeNull()
    expect(AUTH_CONFIG_ERROR_MESSAGE.length).toBeGreaterThan(0)
  })

  it('builds callback url with encoded next path', () => {
    const url = buildAuthCallbackUrl('https://overbound-race.com', '/events/x/register?ticket=1')
    expect(url).toBe(
      'https://overbound-race.com/auth/callback?next=%2Fevents%2Fx%2Fregister%3Fticket%3D1',
    )
  })
})

describe('validateRegisterInput', () => {
  it('validates required fields and format', () => {
    expect(
      validateRegisterInput({ email: '', password: '123456', confirmPassword: '123456' }),
    ).toBe('missing_required_fields')
    expect(
      validateRegisterInput({ email: 'bad', password: '123456', confirmPassword: '123456' }),
    ).toBe('invalid_email')
    expect(
      validateRegisterInput({ email: 'a@b.com', password: '123', confirmPassword: '123' }),
    ).toBe('password_too_short')
    expect(
      validateRegisterInput({
        email: 'a@b.com',
        password: '123456',
        confirmPassword: '654321',
      }),
    ).toBe('password_mismatch')
  })

  it('returns null when input is valid', () => {
    expect(
      validateRegisterInput({
        email: 'runner@overbound.com',
        password: '123456',
        confirmPassword: '123456',
      }),
    ).toBeNull()
  })

  it('maps validation errors to user-friendly messages', () => {
    expect(registerValidationErrorMessage('missing_required_fields')).toContain('obligatoires')
    expect(registerValidationErrorMessage('invalid_email')).toContain('invalide')
    expect(registerValidationErrorMessage('password_too_short')).toContain('6')
    expect(registerValidationErrorMessage('password_mismatch')).toContain('correspondent')
  })
})

describe('auth error mapping', () => {
  it('maps already-registered errors to explicit guidance', () => {
    expect(mapRegisterAuthErrorMessage('User already registered')).toContain('déjà utilisée')
    expect(mapRegisterAuthErrorMessage('This user already exists')).toContain('déjà utilisée')
  })

  it('keeps unknown register errors unchanged', () => {
    const message = 'Unexpected provider error'
    expect(mapRegisterAuthErrorMessage(message)).toBe(message)
  })

  it('maps resend rate-limit messages', () => {
    expect(mapResendConfirmationErrorMessage('For security purposes, please wait')).toContain(
      'Trop de demandes',
    )
    expect(mapResendConfirmationErrorMessage('Too many requests')).toContain('Trop de demandes')
  })

  it('keeps non-rate-limit resend errors unchanged', () => {
    const message = 'SMTP unavailable'
    expect(mapResendConfirmationErrorMessage(message)).toBe(message)
  })

  it('maps oauth callback webview errors to external browser guidance', () => {
    expect(mapOAuthCallbackErrorMessage('access_denied')).toContain('Safari/Chrome')
    expect(mapOAuthCallbackErrorMessage('OAuth provider error: Browser blocked')).toContain(
      'Safari/Chrome',
    )
  })

  it('keeps unknown oauth callback errors unchanged', () => {
    const message = 'Unexpected token exchange issue'
    expect(mapOAuthCallbackErrorMessage(message)).toBe(message)
  })
})
