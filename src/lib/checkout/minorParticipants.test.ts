import { describe, expect, it } from 'vitest'
import { minorParticipantNames } from './minorParticipants'

const context = { eventDate: '2027-04-24T06:00:00.000Z', minimumAge: 16, ticketIsOpenFormat: (ticketId: string) => ticketId === 'open' }

describe('minorParticipantNames', () => {
  it('lists the minors of an order, not the adult who buys for them', () => {
    const names = minorParticipantNames(
      [
        { ticketId: 'open', birthDate: '1985-05-01', firstName: 'Claire' },
        { ticketId: 'open', birthDate: '2010-09-02', firstName: 'Léo' },
      ],
      context,
    )
    expect(names).toEqual(['Léo'])
  })

  it('names nobody when the edition admits adults only, since a minor is then refused instead', () => {
    expect(minorParticipantNames([{ ticketId: 'open', birthDate: '2010-09-02', firstName: 'Léo' }], { ...context, minimumAge: 18 })).toEqual([])
  })

  it('uses a neutral label while the first name is empty', () => {
    expect(minorParticipantNames([{ ticketId: 'open', birthDate: '2010-09-02', firstName: ' ' }], context)).toEqual(['ce participant'])
  })
})
