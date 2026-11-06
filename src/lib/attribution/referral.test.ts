import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildReferralUrl, captureReferralCode, clearReferralCode, readReferralCode } from './referral'

const withUrl = (search: string) => {
  Object.defineProperty(window, 'location', { value: { ...window.location, search }, writable: true })
}

describe('referral code capture', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => vi.useRealTimers())

  it('keeps the ref code of the landing URL in upper case', () => {
    withUrl('?ref=ada20&utm_source=whatsapp')
    captureReferralCode()
    expect(readReferralCode()).toBe('ADA20')
  })

  it('ignores a URL without ref and a malformed ref', () => {
    withUrl('?utm_source=x')
    captureReferralCode()
    withUrl('?ref=<script>alert(1)</script>')
    captureReferralCode()
    expect(readReferralCode()).toBeNull()
  })

  it('does not read the OAuth code parameter', () => {
    withUrl('?code=abc123')
    captureReferralCode()
    expect(readReferralCode()).toBeNull()
  })

  it('forgets the code after 30 days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-10T10:00:00Z'))
    withUrl('?ref=ADA20')
    captureReferralCode()
    vi.setSystemTime(new Date('2026-12-11T10:00:00Z'))
    expect(readReferralCode()).toBeNull()
  })

  it('can be cleared once applied', () => {
    withUrl('?ref=ADA20')
    captureReferralCode()
    clearReferralCode()
    expect(readReferralCode()).toBeNull()
  })
})

describe('buildReferralUrl', () => {
  it('points at the site root with the encoded code', () => {
    expect(buildReferralUrl('https://www.overbound-race.com', 'ADA 20')).toBe('https://www.overbound-race.com/?ref=ADA%2020')
  })

  it('lands on the registration page of the open event when there is one', () => {
    expect(buildReferralUrl('https://www.overbound-race.com', 'ADA20', 'ultra-arena-2027')).toBe(
      'https://www.overbound-race.com/events/ultra-arena-2027/register?ref=ADA20',
    )
  })
})
