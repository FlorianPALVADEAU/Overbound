import { describe, it, expect } from 'vitest'
import convertToSubcurrency from './convertToSubcurrency'

describe('convertToSubcurrency', () => {
  it('converts euros to cents using the default factor of 100', () => {
    expect(convertToSubcurrency(20)).toBe(2000)
    expect(convertToSubcurrency(55)).toBe(5500)
  })

  it('converts with a custom factor', () => {
    expect(convertToSubcurrency(5, 1000)).toBe(5000)
    expect(convertToSubcurrency(1, 10)).toBe(10)
  })

  it('rounds correctly for fractional amounts', () => {
    expect(convertToSubcurrency(19.995)).toBe(2000) // 1999.5 → 2000
    expect(convertToSubcurrency(0.999)).toBe(100)   // 99.9 → 100
    expect(convertToSubcurrency(0.994)).toBe(99)    // 99.4 → 99
  })

  it('returns 0 for a 0 amount', () => {
    expect(convertToSubcurrency(0)).toBe(0)
  })

  it('handles negative amounts', () => {
    expect(convertToSubcurrency(-5)).toBe(-500)
    expect(convertToSubcurrency(-0.5)).toBe(-50)
  })

  it('handles large amounts without precision loss', () => {
    expect(convertToSubcurrency(1000)).toBe(100000)
    expect(convertToSubcurrency(9999.99)).toBe(999999)
  })

  it('factor of 1 returns the same value rounded', () => {
    expect(convertToSubcurrency(5.7, 1)).toBe(6)
    expect(convertToSubcurrency(5.4, 1)).toBe(5)
  })
})
