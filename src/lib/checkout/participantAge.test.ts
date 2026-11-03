import { describe, expect, it } from 'vitest'
import { ageOn, ageRefusalMessage, classifyParticipantAge, isMinorOnEventDate } from './participantAge'

const EVENT = '2026-09-12T06:00:00.000Z'

const classify = (birthDate: string | undefined, overrides: { minimumAge?: number; isOpenFormat?: boolean; eventDate?: string } = {}) =>
  classifyParticipantAge({ birthDate, eventDate: EVENT, minimumAge: 18, isOpenFormat: true, ...overrides })

describe('classifyParticipantAge, edition limited to adults', () => {
  it('accepts someone who turns 18 on the event day', () => {
    expect(classify('2008-09-12')).toEqual({ status: 'adult' })
  })

  it('refuses someone who turns 18 the day after', () => {
    expect(classify('2008-09-13')).toEqual({ status: 'refused', reason: 'too_young' })
  })

  it('refuses a malformed, impossible or missing birth date', () => {
    for (const birthDate of ['12/09/1990', '1990-02-30', '', undefined]) {
      expect(classify(birthDate)).toEqual({ status: 'refused', reason: 'invalid_birth_date' })
    }
  })

  it('refuses when the event date is unknown', () => {
    expect(classify('1990-01-01', { eventDate: 'not a date' })).toEqual({ status: 'refused', reason: 'invalid_birth_date' })
  })
})

describe('classifyParticipantAge, edition open from 16', () => {
  const open16 = { minimumAge: 16 }

  it('treats a 17 year old on the OPEN format as a minor', () => {
    expect(classify('2009-09-13', open16)).toEqual({ status: 'minor' })
  })

  it('accepts someone who turns 16 on the event day', () => {
    expect(classify('2010-09-12', open16)).toEqual({ status: 'minor' })
  })

  it('refuses someone who turns 16 the day after', () => {
    expect(classify('2010-09-13', open16)).toEqual({ status: 'refused', reason: 'too_young' })
  })

  it('refuses a minor on any format other than OPEN', () => {
    expect(classify('2009-09-13', { ...open16, isOpenFormat: false })).toEqual({
      status: 'refused',
      reason: 'minor_open_only',
    })
  })

  it('still accepts an adult on any format', () => {
    expect(classify('1990-01-01', { ...open16, isOpenFormat: false })).toEqual({ status: 'adult' })
  })
})

describe('isMinorOnEventDate', () => {
  it('is true the day before the 18th birthday and false on it', () => {
    expect(isMinorOnEventDate('2008-09-13', EVENT)).toBe(true)
    expect(isMinorOnEventDate('2008-09-12', EVENT)).toBe(false)
  })

  it('is false while the date is incomplete or invalid', () => {
    expect(isMinorOnEventDate('', EVENT)).toBe(false)
    expect(isMinorOnEventDate('2009-02-30', EVENT)).toBe(false)
  })
})

describe('ageRefusalMessage', () => {
  it('names the minimum age of the event', () => {
    expect(ageRefusalMessage('too_young', 16)).toBe("Il faut avoir 16 ans le jour de l'événement.")
  })

  it('tells minors the format they can book', () => {
    expect(ageRefusalMessage('minor_open_only', 16)).toContain('OPEN')
  })
})

describe('ageOn', () => {
  it('counts a 29 February birthday from 1 March in other years', () => {
    expect(ageOn('2008-02-29', new Date('2026-02-28T12:00:00Z'))).toBe(17)
    expect(ageOn('2008-02-29', new Date('2026-03-01T12:00:00Z'))).toBe(18)
  })
})
