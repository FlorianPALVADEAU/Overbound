import { describe, expect, it } from 'vitest'
import { ageRuleHeadline, ageRuleSentence, MINIMUM_AGE_OPTIONS, parseMinimumAge, validateMinimumAgeChange } from './minimumAge'

describe('age rule wording', () => {
  it('says adults only for an event limited to adults', () => {
    expect(ageRuleHeadline(18)).toBe('Réservé aux 18 ans et plus.')
    expect(ageRuleSentence(18)).toBe('Réservé aux personnes majeures (18 ans le jour de l’événement).')
  })

  it('tells 16 to 17 year olds the OPEN-only conditions once the event is open to them', () => {
    expect(ageRuleHeadline(16)).toBe('Dès 16 ans.')
    expect(ageRuleSentence(16)).toContain('format OPEN')
    expect(ageRuleSentence(16)).toContain('autorisation parentale')
  })

  it('never writes an en dash', () => {
    for (const age of MINIMUM_AGE_OPTIONS) {
      expect(ageRuleHeadline(age) + ageRuleSentence(age)).not.toContain(String.fromCharCode(0x2013))
    }
  })
})

describe('parseMinimumAge', () => {
  it('accepts 16 and 18, as number or string', () => {
    expect(parseMinimumAge(16)).toBe(16)
    expect(parseMinimumAge('16')).toBe(16)
    expect(parseMinimumAge(18)).toBe(18)
  })

  it('falls back to adults only for anything else', () => {
    expect(parseMinimumAge(undefined)).toBe(18)
    expect(parseMinimumAge('')).toBe(18)
    expect(parseMinimumAge(14)).toBe(18)
    expect(parseMinimumAge(17)).toBe(18)
    expect(parseMinimumAge('abc')).toBe(18)
  })

  it('lists exactly the two ages the checkout can enforce', () => {
    expect(MINIMUM_AGE_OPTIONS).toEqual([18, 16])
  })
})

describe('validateMinimumAgeChange', () => {
  it('lets the age go down to 16 whatever the registrations', () => {
    expect(validateMinimumAgeChange({ next: 16, current: 18, activeMinorRegistrations: 0 })).toBeNull()
  })

  it('lets the age go back to 18 while no minor is registered', () => {
    expect(validateMinimumAgeChange({ next: 18, current: 16, activeMinorRegistrations: 0 })).toBeNull()
  })

  it('refuses to go back to 18 once minors are registered, and says how many', () => {
    const error = validateMinimumAgeChange({ next: 18, current: 16, activeMinorRegistrations: 3 })
    expect(error).toContain('3')
    expect(error).toContain('mineur')
  })

  it('does not block an unrelated save of an adults-only event', () => {
    expect(validateMinimumAgeChange({ next: 18, current: 18, activeMinorRegistrations: 0 })).toBeNull()
  })
})
