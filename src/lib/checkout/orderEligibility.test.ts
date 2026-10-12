import { describe, expect, it } from 'vitest'
import { checkOrderEligibility } from './orderEligibility'

const context = {
  eventDate: '2026-09-12T06:00:00.000Z',
  tickets: [
    { id: 'open', name: 'Primal OPEN', race: null },
    { id: 'ranked', name: 'Fury RANKED', race: null },
  ],
  hasGroupAnchor: false,
}

const adult = { birthDate: '1990-01-01' }

describe('checkOrderEligibility', () => {
  it('accepts adults with their SAS chosen', () => {
    expect(checkOrderEligibility([{ ticketId: 'open', ...adult, selectedWaveIndex: 2 }, { ticketId: 'ranked', ...adult }], context)).toBeNull()
  })

  it('refuses a participant under 18 on the event day', () => {
    expect(checkOrderEligibility([{ ticketId: 'ranked', birthDate: '2008-09-13' }], context)).toContain('18 ans')
  })

  it('refuses a participant without birth date', () => {
    expect(checkOrderEligibility([{ ticketId: 'ranked' }], context)).toContain('18 ans')
  })

  it('refuses an OPEN participant without SAS', () => {
    expect(checkOrderEligibility([{ ticketId: 'open', ...adult }], context)).toBe('Participant 1 : choisis ton SAS de départ.')
  })

  it('lets a member of an anchored group skip the SAS', () => {
    expect(checkOrderEligibility([{ ticketId: 'open', ...adult }], { ...context, hasGroupAnchor: true })).toBeNull()
  })
})
