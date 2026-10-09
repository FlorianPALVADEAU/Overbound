import { describe, expect, it } from 'vitest'
import { getInitials, getProfileCompletion } from './profile'

describe('getProfileCompletion', () => {
  it('is complete when name, phone and birth date are set', () => {
    const result = getProfileCompletion({ full_name: 'Ana Lys', phone: '+33600000000', date_of_birth: '1990-01-01' })
    expect(result).toEqual({ isComplete: true, missing: [] })
  })

  it('lists exactly the missing fields, blanks included', () => {
    const result = getProfileCompletion({ full_name: 'Ana Lys', phone: '  ', date_of_birth: null })
    expect(result.isComplete).toBe(false)
    expect(result.missing.map((m) => m.field)).toEqual(['phone', 'date_of_birth'])
  })

  it('treats a missing profile as fully incomplete', () => {
    expect(getProfileCompletion(null).missing).toHaveLength(3)
  })
})

describe('getInitials', () => {
  it('uses the first letters of the name', () => {
    expect(getInitials('ana lys martin', null)).toBe('AL')
  })

  it('falls back to the email local part, then a placeholder', () => {
    expect(getInitials(null, 'jean.dupont@example.com')).toBe('JD')
    expect(getInitials(null, null)).toBe('A')
  })
})
