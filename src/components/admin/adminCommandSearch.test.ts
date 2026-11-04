import { describe, expect, it } from 'vitest'
import { ADMIN_NAV_ITEMS } from './adminNavItems'
import { searchAdminNavItems } from './adminCommandSearch'

const values = (query: string) => searchAdminNavItems(ADMIN_NAV_ITEMS, query).map((item) => item.value)

describe('searchAdminNavItems', () => {
  it('returns every page for an empty query', () => {
    expect(searchAdminNavItems(ADMIN_NAV_ITEMS, '   ')).toHaveLength(ADMIN_NAV_ITEMS.length)
  })

  it('ignores case and accents', () => {
    expect(values('EVENEMENTS')).toContain('events')
    expect(values('evénements')).toContain('events')
  })

  it('puts labels starting with the query before labels containing it', () => {
    const result = values('bo')
    expect(result[0]).toBe('bootcamps')
    expect(result).toContain('obstacles')
  })

  it('finds a page by its href when the label does not match', () => {
    expect(values('distribution-lists')).toEqual(['distribution-lists'])
  })

  it('returns nothing when no page matches (success and failure paths)', () => {
    expect(values('zzz-introuvable')).toEqual([])
  })
})
