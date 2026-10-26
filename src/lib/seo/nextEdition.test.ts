import { describe, expect, it } from 'vitest'
import { FALLBACK_NEXT_EDITION, resolveNextEdition } from './nextEdition'

describe('resolveNextEdition', () => {
  it('uses the event date and venue once an event is announced', () => {
    const next = resolveNextEdition({ date: '2027-04-24T07:00:00+00:00', location: 'Île de Loisirs de Saint-Quentin' })
    expect(next).toMatchObject({
      confirmed: true,
      window: 'le 24 avril 2027',
      shortLabel: '24 avril 2027',
      venue: 'Île de Loisirs de Saint-Quentin',
    })
  })

  it('reads the date in Paris time, not UTC', () => {
    expect(resolveNextEdition({ date: '2027-04-23T23:30:00+00:00', location: null }).shortLabel).toBe('24 avril 2027')
  })

  it('falls back to the window when there is no event or the date is invalid', () => {
    expect(resolveNextEdition(null)).toBe(FALLBACK_NEXT_EDITION)
    expect(resolveNextEdition({ date: 'not-a-date', location: 'x' })).toBe(FALLBACK_NEXT_EDITION)
    expect(FALLBACK_NEXT_EDITION.confirmed).toBe(false)
  })
})
