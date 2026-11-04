import { describe, expect, it } from 'vitest'
import { parseSeasonParam } from './seasonParam'

describe('parseSeasonParam', () => {
  it('reads a season key and falls back to the running season when absent', () => {
    expect(parseSeasonParam('2027')).toBe(2027)
    expect(parseSeasonParam(null)).toBeNull()
    expect(parseSeasonParam('')).toBeNull()
  })

  it('ignores values that are not a season key', () => {
    expect(parseSeasonParam('2027.5')).toBeNull()
    expect(parseSeasonParam('abc')).toBeNull()
    expect(parseSeasonParam('1999')).toBeNull()
  })
})
