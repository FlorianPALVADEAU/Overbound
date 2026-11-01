import { describe, expect, it } from 'vitest'
import { checkCompanionOrder, countCompanions, type CompanionWaveRow } from './companionEligibility'

const EVENT_DATE = '2026-09-12T00:00:00.000Z'
const RANKED = {
  id: 'ranked',
  operations_config: {
    open_companion: { ticket_id: 'open', price_cents: 2900, ranked_max_duration_minutes: 230, min_gap_minutes: 20 },
  },
}
const wave = (overrides: Partial<CompanionWaveRow> = {}): CompanionWaveRow => ({
  ticket_id: 'open',
  wave_index: 5,
  start_time: '2026-09-12T11:00:00.000Z',
  capacity: 50,
  assigned_count: 10,
  is_closed: false,
  ...overrides,
})
const check = (
  participants: Array<{ ticketId: string; companionWaveIndex?: number | null }>,
  waves: CompanionWaveRow[] = [wave()],
  tickets = [RANKED, { id: 'plain', operations_config: null }],
) => checkCompanionOrder(participants, { eventDate: EVENT_DATE, tickets, waves })

describe('checkCompanionOrder', () => {
  it('accepts a late enough SAS with room', () => {
    expect(check([{ ticketId: 'ranked', companionWaveIndex: 5 }])).toBeNull()
  })

  it('ignores participants without the option', () => {
    expect(check([{ ticketId: 'plain' }, { ticketId: 'ranked', companionWaveIndex: null }], [])).toBeNull()
  })

  it('refuses the option on a ticket that has none', () => {
    expect(check([{ ticketId: 'plain', companionWaveIndex: 5 }])).toBe(
      "Participant 1 : l'option OPEN n'est pas disponible pour ce billet.",
    )
  })

  it('refuses an unknown SAS, including one of another OPEN ticket', () => {
    expect(check([{ ticketId: 'ranked', companionWaveIndex: 9 }])).toBe('Participant 1 : SAS OPEN introuvable.')
    expect(check([{ ticketId: 'ranked', companionWaveIndex: 5 }], [wave({ ticket_id: 'other' })])).toBe(
      'Participant 1 : SAS OPEN introuvable.',
    )
  })

  it('refuses a SAS before the RANKED finish plus the rest (first one is 12h10)', () => {
    const tooEarly = wave({ start_time: '2026-09-12T10:00:00.000Z' })
    expect(check([{ ticketId: 'ranked', companionWaveIndex: 5 }], [tooEarly])).toContain('Trop tôt')
    const firstAllowed = wave({ start_time: '2026-09-12T10:10:00.000Z' })
    expect(check([{ ticketId: 'ranked', companionWaveIndex: 5 }], [firstAllowed])).toBeNull()
  })

  it('refuses a full or closed SAS', () => {
    expect(check([{ ticketId: 'ranked', companionWaveIndex: 5 }], [wave({ assigned_count: 50 })])).toBe(
      'Participant 1 : SAS complet.',
    )
    expect(check([{ ticketId: 'ranked', companionWaveIndex: 5 }], [wave({ is_closed: true })])).toBe(
      'Participant 1 : SAS complet.',
    )
  })

  it('counts the other companions of the same order against the SAS capacity', () => {
    const lastSeat = wave({ assigned_count: 49 })
    const two = [
      { ticketId: 'ranked', companionWaveIndex: 5 },
      { ticketId: 'ranked', companionWaveIndex: 5 },
    ]
    expect(check(two, [lastSeat])).toBe('Participant 2 : SAS complet.')
    expect(check(two.slice(0, 1), [lastSeat])).toBeNull()
  })
})

describe('countCompanions', () => {
  it('counts the participants that took the option', () => {
    expect(countCompanions([{ ticketId: 'a', companionWaveIndex: 3 }, { ticketId: 'b' }, { ticketId: 'c', companionWaveIndex: null }])).toBe(1)
  })
})
