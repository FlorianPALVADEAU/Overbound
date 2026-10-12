import { describe, expect, it } from 'vitest'
import { ageOn, isAdultOnEventDate } from './participantAge'

const EVENT = '2026-09-12T06:00:00.000Z'

describe('isAdultOnEventDate', () => {
  it('accepts someone who turns 18 on the event day', () => {
    expect(isAdultOnEventDate('2008-09-12', EVENT)).toBe(true)
  })

  it('refuses someone who turns 18 the day after', () => {
    expect(isAdultOnEventDate('2008-09-13', EVENT)).toBe(false)
  })

  it('refuses a malformed or impossible date', () => {
    expect(isAdultOnEventDate('12/09/1990', EVENT)).toBe(false)
    expect(isAdultOnEventDate('1990-02-30', EVENT)).toBe(false)
    expect(isAdultOnEventDate('', EVENT)).toBe(false)
  })

  it('refuses when the event date is unknown', () => {
    expect(isAdultOnEventDate('1990-01-01', 'not a date')).toBe(false)
  })
})

describe('ageOn', () => {
  it('counts a 29 February birthday from 1 March in other years', () => {
    expect(ageOn('2008-02-29', new Date('2026-02-28T12:00:00Z'))).toBe(17)
    expect(ageOn('2008-02-29', new Date('2026-03-01T12:00:00Z'))).toBe(18)
  })
})
