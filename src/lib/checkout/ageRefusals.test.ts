import { describe, expect, it } from 'vitest'
import { birthDateRefusals } from './ageRefusals'

const EVENT = '2026-09-12T06:00:00.000Z'
const RANKED_TICKET = 'ticket-ranked'
const OPEN_TICKET = 'ticket-open'

const check = (participants: { id: string; ticketId: string; birthDate: string }[], minimumAge = 16) =>
  birthDateRefusals(participants, {
    eventDate: EVENT,
    minimumAge,
    ticketIsOpenFormat: (ticketId) => ticketId === OPEN_TICKET,
  })

describe('birthDateRefusals', () => {
  it('refuses a minor on a RANKED ticket at once, with the OPEN-only reason', () => {
    expect(check([{ id: 'p1', ticketId: RANKED_TICKET, birthDate: '2010-05-01' }])).toEqual({
      p1: "Avant 18 ans, l'inscription est possible uniquement au format OPEN.",
    })
  })

  it('accepts a minor on an OPEN ticket', () => {
    expect(check([{ id: 'p1', ticketId: OPEN_TICKET, birthDate: '2010-05-01' }])).toEqual({})
  })

  it('accepts an adult on a RANKED ticket', () => {
    expect(check([{ id: 'p1', ticketId: RANKED_TICKET, birthDate: '1990-05-01' }])).toEqual({})
  })

  it('refuses someone under the minimum age on any ticket', () => {
    expect(check([{ id: 'p1', ticketId: OPEN_TICKET, birthDate: '2012-05-01' }])).toEqual({
      p1: "Il faut avoir 16 ans le jour de l'événement.",
    })
  })

  it('leaves an empty birth date to the required-field check', () => {
    expect(check([{ id: 'p1', ticketId: RANKED_TICKET, birthDate: '  ' }])).toEqual({})
  })

  it('reports each participant on their own', () => {
    const refusals = check([
      { id: 'p1', ticketId: RANKED_TICKET, birthDate: '2010-05-01' },
      { id: 'p2', ticketId: OPEN_TICKET, birthDate: '2010-05-01' },
      { id: 'p3', ticketId: RANKED_TICKET, birthDate: '1990-05-01' },
    ])
    expect(Object.keys(refusals)).toEqual(['p1'])
  })
})
