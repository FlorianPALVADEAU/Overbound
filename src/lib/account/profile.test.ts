import { describe, expect, it } from 'vitest'
import { firstNameFromUserMetadata, formatProfileName, getInitials, getProfileCompletion, getProfileFirstName, profileNameFromUserMetadata, splitFullName } from './profile'

describe('getProfileCompletion', () => {
  it('is complete when both names, phone and birth date are set', () => {
    const result = getProfileCompletion({ first_name: 'Ana', last_name: 'Lys', phone: '+33600000000', date_of_birth: '1990-01-01' })
    expect(result).toEqual({ isComplete: true, missing: [] })
  })

  it('lists exactly the missing fields, blanks included', () => {
    const result = getProfileCompletion({ first_name: 'Ana', last_name: 'Lys', phone: '  ', date_of_birth: null })
    expect(result.isComplete).toBe(false)
    expect(result.missing.map((m) => m.field)).toEqual(['phone', 'date_of_birth'])
  })

  it('flags a profile without a last name (single-word legacy name)', () => {
    const result = getProfileCompletion({ first_name: 'Ana', last_name: null, phone: '+33600000000', date_of_birth: '1990-01-01' })
    expect(result.missing.map((m) => m.field)).toEqual(['last_name'])
  })

  it('treats a missing profile as fully incomplete', () => {
    expect(getProfileCompletion(null).missing).toHaveLength(4)
  })
})

describe('formatProfileName', () => {
  it('joins first and last name, trimming blanks', () => {
    expect(formatProfileName({ first_name: ' Ana ', last_name: 'Lys' })).toBe('Ana Lys')
  })

  it('returns the single part that exists, null when both are empty', () => {
    expect(formatProfileName({ first_name: 'Ana', last_name: null })).toBe('Ana')
    expect(formatProfileName({ first_name: '  ', last_name: '' })).toBeNull()
    expect(formatProfileName(null)).toBeNull()
  })
})

describe('getProfileFirstName', () => {
  it('returns the trimmed first name or null', () => {
    expect(getProfileFirstName({ first_name: ' Ana ', last_name: 'Lys' })).toBe('Ana')
    expect(getProfileFirstName({ first_name: null, last_name: 'Lys' })).toBeNull()
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

describe('splitFullName', () => {
  it('uses the first word as first name and the rest as last name', () => {
    expect(splitFullName('  Claire de la Tour ')).toEqual({ firstName: 'Claire', lastName: 'de la Tour' })
  })

  it('returns nulls for blanks and for emails', () => {
    expect(splitFullName('   ')).toEqual({ firstName: null, lastName: null })
    expect(splitFullName('jean@example.com')).toEqual({ firstName: null, lastName: null })
    expect(splitFullName(undefined)).toEqual({ firstName: null, lastName: null })
  })
})

describe('profileNameFromUserMetadata', () => {
  it('prefers the explicit first and last name set at signup', () => {
    expect(profileNameFromUserMetadata({ first_name: 'Camille', last_name: 'Martin', full_name: 'Autre Nom' })).toEqual({ first_name: 'Camille', last_name: 'Martin' })
  })

  it('splits the provider full name when no explicit name exists (Google)', () => {
    expect(profileNameFromUserMetadata({ full_name: 'Ana Lys Martin' })).toEqual({ first_name: 'Ana', last_name: 'Lys Martin' })
    expect(profileNameFromUserMetadata({ name: 'Ana' })).toEqual({ first_name: 'Ana', last_name: null })
  })

  it('returns empty names for missing metadata', () => {
    expect(profileNameFromUserMetadata(null)).toEqual({ first_name: null, last_name: null })
    expect(firstNameFromUserMetadata({ full_name: 'jean@example.com' })).toBeNull()
  })
})
