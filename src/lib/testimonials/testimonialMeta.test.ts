import { describe, expect, it } from 'vitest'
import { testimonialMeta } from './testimonialMeta'

describe('testimonialMeta', () => {
  it('joins age and location', () => {
    expect(testimonialMeta({ age: 22, location: 'Jouars' })).toBe('22 ans • Jouars')
  })

  it('keeps the part that exists', () => {
    expect(testimonialMeta({ age: 22 })).toBe('22 ans')
    expect(testimonialMeta({ location: 'Jouars' })).toBe('Jouars')
  })

  it('returns an empty string when nothing is known', () => {
    expect(testimonialMeta({})).toBe('')
  })
})
