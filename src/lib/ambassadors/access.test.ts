import { describe, it, expect } from 'vitest'
import { hasAmbassadorAccess } from './access'

describe('hasAmbassadorAccess', () => {
  describe('role-based access', () => {
    it('grants access when role is "ambassador"', () => {
      expect(hasAmbassadorAccess({ role: 'ambassador' })).toBe(true)
    })

    it('denies access for role "user" with no allowlisted email', () => {
      expect(hasAmbassadorAccess({ role: 'user', email: 'user@example.com' })).toBe(false)
    })

    it('denies access for role "admin" with no allowlisted email', () => {
      expect(hasAmbassadorAccess({ role: 'admin', email: 'admin@example.com' })).toBe(false)
    })

    it('grants access for "ambassador" role even without an email', () => {
      expect(hasAmbassadorAccess({ role: 'ambassador', email: null })).toBe(true)
    })
  })

  describe('email allowlist access', () => {
    it('grants access for the allowlisted email with a standard user role', () => {
      expect(hasAmbassadorAccess({ role: 'user', email: 'florian.plvd@gmail.com' })).toBe(true)
    })

    it('normalizes email to lowercase before allowlist check', () => {
      expect(hasAmbassadorAccess({ role: 'user', email: 'Florian.PLVD@gmail.com' })).toBe(true)
    })

    it('trims whitespace from email before allowlist check', () => {
      expect(hasAmbassadorAccess({ role: 'user', email: '  florian.plvd@gmail.com  ' })).toBe(true)
    })

    it('denies access for an email not on the allowlist', () => {
      expect(hasAmbassadorAccess({ role: 'user', email: 'other@example.com' })).toBe(false)
    })
  })

  describe('missing or null values', () => {
    it('denies access when email is null and role is not ambassador', () => {
      expect(hasAmbassadorAccess({ role: 'user', email: null })).toBe(false)
    })

    it('denies access when both role and email are undefined', () => {
      expect(hasAmbassadorAccess({})).toBe(false)
    })

    it('denies access when role is undefined and email is not allowlisted', () => {
      expect(hasAmbassadorAccess({ email: 'nobody@example.com' })).toBe(false)
    })

    it('denies access when role is null and no email provided', () => {
      expect(hasAmbassadorAccess({ role: null })).toBe(false)
    })
  })
})
