import { describe, expect, it } from 'vitest'
import { decodeAdminUsersCursor, encodeAdminUsersCursor, sanitizeAdminUserSearch } from './usersList'

describe('admin users cursor', () => {
  it('round-trips the offset for the same sort and direction', () => {
    const cursor = encodeAdminUsersCursor({ sort: 'created_at', direction: 'desc', offset: 50 })

    expect(decodeAdminUsersCursor(cursor, 'created_at', 'desc')).toEqual({ sort: 'created_at', direction: 'desc', offset: 50 })
  })

  it('refuses a cursor built for another sort or direction', () => {
    const cursor = encodeAdminUsersCursor({ sort: 'created_at', direction: 'desc', offset: 50 })

    expect(() => decodeAdminUsersCursor(cursor, 'email', 'desc')).toThrow('Cursor de pagination incompatible')
    expect(() => decodeAdminUsersCursor(cursor, 'created_at', 'asc')).toThrow('Cursor de pagination incompatible')
  })

  it('refuses a cursor that is not base64 JSON', () => {
    expect(() => decodeAdminUsersCursor('pas-un-curseur', 'created_at', 'desc')).toThrow('Cursor de pagination invalide')
  })

  it('refuses a negative or fractional offset', () => {
    const negative = Buffer.from(JSON.stringify({ sort: 'created_at', direction: 'desc', offset: -1 })).toString('base64url')
    const fractional = Buffer.from(JSON.stringify({ sort: 'created_at', direction: 'desc', offset: 1.5 })).toString('base64url')

    expect(() => decodeAdminUsersCursor(negative, 'created_at', 'desc')).toThrow('Cursor de pagination invalide')
    expect(() => decodeAdminUsersCursor(fractional, 'created_at', 'desc')).toThrow('Cursor de pagination invalide')
  })
})

describe('sanitizeAdminUserSearch', () => {
  it('trims, lowercases and collapses spaces', () => {
    expect(sanitizeAdminUserSearch('  Jean   DUPONT ')).toBe('jean dupont')
  })

  it('keeps an empty string empty so the caller can skip the filter', () => {
    expect(sanitizeAdminUserSearch('   ')).toBe('')
  })
})
