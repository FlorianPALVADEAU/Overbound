import { describe, expect, it } from 'vitest'
import { getFirstName } from './participantName'

describe('getFirstName', () => {
  it('returns the first word of a full name', () => {
    expect(getFirstName('  Alex   Runner ')).toBe('Alex')
  })

  it('returns null for an email address, an empty value or nothing', () => {
    expect(getFirstName('alex@example.com')).toBeNull()
    expect(getFirstName('   ')).toBeNull()
    expect(getFirstName(undefined)).toBeNull()
  })
})
