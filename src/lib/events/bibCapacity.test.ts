import { describe, expect, it } from 'vitest'
import { isRankedCapacityWithinTotal, parseBibCapacity, validateBibConfigChange } from './bibCapacity'

describe('parseBibCapacity', () => {
  it('accepte un entier positif, number ou string', () => {
    expect(parseBibCapacity(500)).toBe(500)
    expect(parseBibCapacity('250')).toBe(250)
  })

  it.each([null, undefined, '', '0', -3, 'abc', 1.5])('renvoie null pour %s', (value) => {
    expect(parseBibCapacity(value)).toBeNull()
  })
})

describe('isRankedCapacityWithinTotal', () => {
  it('accepte null et une valeur <= total', () => {
    expect(isRankedCapacityWithinTotal(500, null)).toBe(true)
    expect(isRankedCapacityWithinTotal(500, 500)).toBe(true)
  })

  it('refuse une valeur > total', () => {
    expect(isRankedCapacityWithinTotal(500, 501)).toBe(false)
  })
})

describe('validateBibConfigChange', () => {
  const base = {
    next: { capacity: 500, ranked: 100 },
    current: { capacity: 500, ranked: 100 },
    maxRankedBib: null,
    maxBib: null,
    hasOpenBib: false,
  }

  it('accepte une config inchangée ou sans dossard attribué', () => {
    expect(validateBibConfigChange(base)).toBeNull()
    expect(validateBibConfigChange({ ...base, next: { capacity: 800, ranked: 200 } })).toBeNull()
  })

  it('refuse ranked > total', () => {
    expect(validateBibConfigChange({ ...base, next: { capacity: 100, ranked: 200 } })).toMatch(/dépasser/)
  })

  it('refuse de changer ranked quand des dossards OPEN existent', () => {
    expect(
      validateBibConfigChange({ ...base, hasOpenBib: true, next: { capacity: 500, ranked: 120 } }),
    ).toMatch(/OPEN/)
    expect(validateBibConfigChange({ ...base, hasOpenBib: true })).toBeNull()
  })

  it('refuse de passer sous un dossard déjà attribué', () => {
    expect(validateBibConfigChange({ ...base, maxRankedBib: 80, next: { capacity: 500, ranked: 50 } })).toMatch(/80/)
    expect(validateBibConfigChange({ ...base, maxBib: 450, next: { capacity: 400, ranked: 100 } })).toMatch(/450/)
  })
})
