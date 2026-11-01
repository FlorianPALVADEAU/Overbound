import { describe, expect, it } from 'vitest'
import {
  getCompanionEarliestStart,
  getCompanionWaveAvailability,
  parseOpenCompanionConfig,
  readPaidCompanions,
  resolveCompanionOffer,
  resolveRankedStart,
} from './openCompanion'

const VALID = {
  open_companion: { ticket_id: 'open-1', price_cents: 2900, ranked_max_duration_minutes: 230, min_gap_minutes: 20 },
}
const CONFIG = parseOpenCompanionConfig(VALID)!
const VALID_TICKET = { operations_config: VALID }

describe('parseOpenCompanionConfig', () => {
  it('reads a complete contract', () => {
    expect(CONFIG).toEqual({ openTicketId: 'open-1', priceCents: 2900, rankedMaxDurationMinutes: 230, minGapMinutes: 20 })
  })

  it('accepts a zero gap', () => {
    const config = parseOpenCompanionConfig({ open_companion: { ...VALID.open_companion, min_gap_minutes: 0 } })
    expect(config?.minGapMinutes).toBe(0)
  })

  it.each([
    ['no config', null],
    ['no key', {}],
    ['not an object', { open_companion: 'yes' }],
    ['no ticket', { open_companion: { ...VALID.open_companion, ticket_id: '' } }],
    ['free option', { open_companion: { ...VALID.open_companion, price_cents: 0 } }],
    ['fractional price', { open_companion: { ...VALID.open_companion, price_cents: 29.5 } }],
    ['string price', { open_companion: { ...VALID.open_companion, price_cents: '2900' } }],
    ['no duration', { open_companion: { ...VALID.open_companion, ranked_max_duration_minutes: 0 } }],
    ['negative gap', { open_companion: { ...VALID.open_companion, min_gap_minutes: -5 } }],
  ])('refuses an incomplete contract: %s', (_label, config) => {
    expect(parseOpenCompanionConfig(config)).toBeNull()
  })
})

describe('resolveRankedStart', () => {
  it('uses the ticket fixed start when it has one', () => {
    const start = resolveRankedStart({ fixed_start_time: '2026-09-12T06:30:00.000Z' }, '2026-09-12T00:00:00.000Z')
    expect(start.toISOString()).toBe('2026-09-12T06:30:00.000Z')
  })

  it('falls back to the event RANKED departure (8h00 Paris)', () => {
    const start = resolveRankedStart(null, '2026-09-12T00:00:00.000Z')
    expect(start.toISOString()).toBe('2026-09-12T06:00:00.000Z')
  })

  it('ignores an unreadable fixed start', () => {
    const start = resolveRankedStart({ fixed_start_time: 'tomorrow' }, '2026-09-12T00:00:00.000Z')
    expect(start.toISOString()).toBe('2026-09-12T06:00:00.000Z')
  })
})

describe('open companion SAS rule', () => {
  // RANKED 8h00 + 230 min on course + 20 min rest = first OPEN start at 12h10 Paris (10h10 UTC).
  const earliest = getCompanionEarliestStart(CONFIG, new Date('2026-09-12T06:00:00.000Z'))

  it('puts the first allowed OPEN start at 12h10', () => {
    expect(earliest.toISOString()).toBe('2026-09-12T10:10:00.000Z')
  })

  it('accepts a SAS starting exactly at the earliest time', () => {
    expect(
      getCompanionWaveAvailability({ startTime: '2026-09-12T10:10:00.000Z', capacity: 50, assignedCount: 10 }, earliest),
    ).toEqual({ selectable: true })
  })

  it('refuses a SAS one minute too early', () => {
    expect(
      getCompanionWaveAvailability({ startTime: '2026-09-12T10:09:00.000Z', capacity: 50, assignedCount: 0 }, earliest),
    ).toEqual({ selectable: false, reason: 'TOO_EARLY' })
  })

  it('refuses a full SAS', () => {
    expect(
      getCompanionWaveAvailability({ startTime: '2026-09-12T11:00:00.000Z', capacity: 50, assignedCount: 50 }, earliest),
    ).toEqual({ selectable: false, reason: 'FULL' })
  })

  it('reports too early before full when both apply', () => {
    expect(
      getCompanionWaveAvailability({ startTime: '2026-09-12T10:00:00.000Z', capacity: 50, assignedCount: 50 }, earliest),
    ).toEqual({ selectable: false, reason: 'TOO_EARLY' })
  })

  it('refuses a SAS with an unreadable start', () => {
    expect(getCompanionWaveAvailability({ startTime: 'nope', capacity: 50, assignedCount: 0 }, earliest)).toEqual({
      selectable: false,
      reason: 'TOO_EARLY',
    })
  })
})

describe('readPaidCompanions', () => {
  it('pairs participant, SAS and price', () => {
    expect(
      readPaidCompanions({ companion_participants: '0,2', companion_waves: '5,9', companion_prices: '2900,2900' }),
    ).toEqual([
      { participantIndex: 0, waveIndex: 5, priceCents: 2900 },
      { participantIndex: 2, waveIndex: 9, priceCents: 2900 },
    ])
  })

  it('returns nothing without the option', () => {
    expect(readPaidCompanions({ companion_participants: '', companion_waves: '', companion_prices: '' })).toEqual([])
    expect(readPaidCompanions({})).toEqual([])
    expect(readPaidCompanions(null)).toEqual([])
  })

  it('trusts nothing when the lists disagree', () => {
    expect(readPaidCompanions({ companion_participants: '0,1', companion_waves: '5', companion_prices: '2900,2900' })).toEqual([])
  })
})

describe('resolveCompanionOffer', () => {
  const openTicket = { id: 'open-1', name: 'Primal OPEN', final_price_cents: 6000 }

  it('describes the option with its saving and its first allowed start (12h10 Paris)', () => {
    const offer = resolveCompanionOffer(VALID_TICKET, [openTicket], '2026-09-12T00:00:00.000Z')
    expect(offer).toMatchObject({ openTicketId: 'open-1', openTicketName: 'Primal OPEN', priceCents: 2900, fullPriceCents: 6000 })
    expect(offer?.earliestStart.toISOString()).toBe('2026-09-12T10:10:00.000Z')
  })

  it('offers nothing on a ticket without the contract', () => {
    expect(resolveCompanionOffer({ operations_config: null }, [openTicket], '2026-09-12T00:00:00.000Z')).toBeNull()
  })

  it('offers nothing when the OPEN ticket is not part of the event', () => {
    expect(resolveCompanionOffer(VALID_TICKET, [{ id: 'other', name: 'Other' }], '2026-09-12T00:00:00.000Z')).toBeNull()
  })
})
