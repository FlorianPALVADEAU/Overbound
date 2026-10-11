import { describe, expect, it } from 'vitest'
import { anonymizeIp } from './anonymizeIp'

describe('anonymizeIp', () => {
  it('zeroes the last IPv4 octet', () => {
    expect(anonymizeIp('203.0.113.42')).toBe('203.0.113.0')
  })

  it('keeps the IPv6 /48 only', () => {
    expect(anonymizeIp('2001:db8:abcd:12:1:2:3:4')).toBe('2001:db8:abcd::')
  })

  it('returns null for a missing or malformed address', () => {
    expect(anonymizeIp(null)).toBeNull()
    expect(anonymizeIp('not-an-ip')).toBeNull()
  })
})
