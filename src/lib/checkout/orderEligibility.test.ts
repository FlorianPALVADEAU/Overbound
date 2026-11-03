import { describe, expect, it } from 'vitest'
import { checkOrderEligibility } from './orderEligibility'

const context = {
  eventDate: '2026-09-12T06:00:00.000Z',
  minimumAge: 18,
  tickets: [
    { id: 'open', name: 'Primal OPEN', race: null },
    { id: 'ranked', name: 'Fury RANKED', race: null },
  ],
  hasGroupAnchor: false,
}

const adult = { birthDate: '1990-01-01' }
const minor = { birthDate: '2009-09-13' }
const minorContacts = { guardianName: 'Anne Martin', guardianPhone: '0612345678', referentName: 'Anne Martin', referentPhone: '0612345678' }
const edition16 = { ...context, minimumAge: 16 }

describe('checkOrderEligibility', () => {
  it('accepts adults with their SAS chosen', () => {
    expect(checkOrderEligibility([{ ticketId: 'open', ...adult, selectedWaveIndex: 2 }, { ticketId: 'ranked', ...adult }], context)).toBeNull()
  })

  it('refuses a participant under 18 on the event day when the edition is for adults', () => {
    expect(checkOrderEligibility([{ ticketId: 'ranked', birthDate: '2008-09-13' }], context)).toContain('18 ans')
    expect(checkOrderEligibility([{ ticketId: 'open', ...minor, ...minorContacts, selectedWaveIndex: 2 }], context)).toContain('18 ans')
  })

  it('refuses a participant without birth date', () => {
    expect(checkOrderEligibility([{ ticketId: 'ranked' }], context)).toContain('Date de naissance')
  })

  it('refuses an OPEN participant without SAS', () => {
    expect(checkOrderEligibility([{ ticketId: 'open', ...adult }], context)).toBe('Participant 1 : choisis ton SAS de départ.')
  })

  it('lets a member of an anchored group skip the SAS', () => {
    expect(checkOrderEligibility([{ ticketId: 'open', ...adult }], { ...context, hasGroupAnchor: true })).toBeNull()
  })
})

describe('checkOrderEligibility, edition open from 16', () => {
  it('accepts a 17 year old on OPEN with the representative and the adult on site', () => {
    expect(
      checkOrderEligibility([{ ticketId: 'open', ...minor, ...minorContacts, selectedWaveIndex: 2 }], edition16),
    ).toBeNull()
  })

  it('refuses a minor on RANKED', () => {
    expect(checkOrderEligibility([{ ticketId: 'ranked', ...minor, ...minorContacts }], edition16)).toContain('OPEN')
  })

  it('refuses a minor whose representative or adult on site is missing', () => {
    const result = checkOrderEligibility(
      [{ ticketId: 'open', ...minor, ...minorContacts, referentPhone: '', selectedWaveIndex: 2 }],
      edition16,
    )
    expect(result).toBe("Participant 1 : le représentant légal et l'adulte référent sont obligatoires avant 18 ans.")
  })

  it('does not ask an adult for the minor contacts', () => {
    expect(checkOrderEligibility([{ ticketId: 'open', ...adult, selectedWaveIndex: 2 }], edition16)).toBeNull()
  })

  it('refuses someone younger than the edition minimum', () => {
    expect(checkOrderEligibility([{ ticketId: 'open', birthDate: '2010-09-13', ...minorContacts, selectedWaveIndex: 2 }], edition16)).toContain('16 ans')
  })
})
