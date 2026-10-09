import { describe, expect, it } from 'vitest'
import { getAccountSpaces, normalizeRoles, resolveAccountAccess } from './spaces'

const spacesFor = (roles: string[], email: string | null = 'user@example.com') =>
  getAccountSpaces(resolveAccountAccess(roles, email))

describe('normalizeRoles', () => {
  it('flattens strings, comma lists and arrays, dropping empties', () => {
    expect(normalizeRoles(['Admin', null, 'volunteer, Staff', ['Ambassador'], undefined, ''])).toEqual([
      'admin',
      'volunteer',
      'staff',
      'ambassador',
    ])
  })
})

describe('getAccountSpaces', () => {
  it('exposes nothing to a regular participant', () => {
    expect(spacesFor(['user'])).toEqual([])
  })

  it('exposes administration to admins', () => {
    expect(spacesFor(['admin']).map((s) => s.id)).toEqual(['admin'])
  })

  it('exposes the volunteer space, not administration, to volunteers', () => {
    const spaces = spacesFor(['volunteer'])
    expect(spaces.map((s) => s.id)).toEqual(['volunteer'])
    expect(spaces[0]?.href).toBe('/dashboard')
  })

  it('exposes the ambassador dashboard to ambassadors, alongside the admin one when both', () => {
    expect(spacesFor(['ambassador']).map((s) => s.id)).toEqual(['ambassador'])
    expect(spacesFor(['admin', 'ambassador']).map((s) => s.id)).toEqual(['admin', 'ambassador'])
  })
})
