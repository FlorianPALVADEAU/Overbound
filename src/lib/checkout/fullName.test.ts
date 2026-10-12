import { describe, expect, it } from 'vitest'
import { splitFullName } from './fullName'

describe('splitFullName', () => {
  it('keeps compound last names together', () => {
    expect(splitFullName('Camille de La Tour')).toEqual({ firstName: 'Camille', lastName: 'de La Tour' })
  })

  it('returns empty names when the account has none', () => {
    expect(splitFullName(null)).toEqual({ firstName: '', lastName: '' })
    expect(splitFullName('   ')).toEqual({ firstName: '', lastName: '' })
  })
})
