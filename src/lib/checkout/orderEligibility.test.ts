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

const adult = { birthDate: '1990-01-01', sex: 'femme' as const }
const minor = { birthDate: '2009-09-13', sex: 'homme' as const }
const minorContacts = {
  guardianName: 'Anne Martin',
  guardianPhone: '0612345678',
  guardianEmail: 'anne.martin@example.com',
  referentName: 'Anne Martin',
  referentPhone: '0612345678',
}
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

  it('refuses a participant without sex, for the rankings', () => {
    expect(checkOrderEligibility([{ ticketId: 'ranked', birthDate: '1990-01-01' }], context)).toBe(
      'Participant 1 : indique le sexe du participant, pour les classements.',
    )
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

  it('refuses a minor whose representative has no email', () => {
    const result = checkOrderEligibility(
      [{ ticketId: 'open', ...minor, ...minorContacts, guardianEmail: undefined, selectedWaveIndex: 2 }],
      edition16,
    )
    expect(result).toBe("Participant 1 : le représentant légal et l'adulte référent sont obligatoires avant 18 ans.")
  })

  it('refuses a minor whose representative email is malformed, because the ticket copy would bounce', () => {
    const result = checkOrderEligibility(
      [{ ticketId: 'open', ...minor, ...minorContacts, guardianEmail: 'anne.martin@', selectedWaveIndex: 2 }],
      edition16,
    )
    expect(result).toBe("Participant 1 : l'adresse email du représentant légal est invalide.")
  })

  it('refuses a participant whose own email is malformed, because the ticket would never arrive', () => {
    expect(checkOrderEligibility([{ ticketId: 'open', ...adult, email: 'alice@', selectedWaveIndex: 2 }], context)).toBe(
      "Participant 1 : l'adresse email du participant est invalide.",
    )
  })

  it('accepts an empty participant email, the buyer account address then stands in', () => {
    expect(checkOrderEligibility([{ ticketId: 'open', ...adult, email: '', selectedWaveIndex: 2 }], context)).toBeNull()
  })

  it('accepts a representative email with surrounding spaces', () => {
    expect(
      checkOrderEligibility(
        [{ ticketId: 'open', ...minor, ...minorContacts, guardianEmail: ' anne.martin@example.com ', selectedWaveIndex: 2 }],
        edition16,
      ),
    ).toBeNull()
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
