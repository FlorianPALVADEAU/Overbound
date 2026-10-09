import { describe, expect, it } from 'vitest'
import { buildEventLandingView, describeTicketDeparture, splitDepartureWaves, MAX_VISIBLE_DEPARTURES, type LandingTicket } from './eventLandingView'

const ticket = (id: string, name: string, cents: number, race?: LandingTicket['race']): LandingTicket => ({
  id,
  name,
  final_price_cents: cents,
  currency: 'EUR',
  race,
})

const build = (tickets: LandingTicket[]) =>
  buildEventLandingView({ tickets, priceTiers: [], eventSlug: 'edition-x' })

describe('buildEventLandingView', () => {
  it('detects both formats and the lowest price', () => {
    const view = build([ticket('a', 'Pass OPEN', 4500), ticket('b', 'Pass RANKED', 6500)])
    expect(view.hasBothFormats).toBe(true)
    expect(view.openTicket?.id).toBe('a')
    expect(view.rankedTicket?.id).toBe('b')
    expect(view.lowestPriceCents).toBe(4500)
    expect(view.soleTicketId).toBeNull()
  })

  it('does not treat a RANKED ticket as OPEN', () => {
    const view = build([ticket('b', 'Pass RANKED', 6500, { name: 'Open arena' })])
    expect(view.openTicket).toBeNull()
    expect(view.hasBothFormats).toBe(false)
  })

  it('preselects the ticket only when there is a single one', () => {
    const view = build([ticket('solo', 'Pass', 3000)])
    expect(view.soleTicketId).toBe('solo')
    expect(view.registerHref(view.soleTicketId ?? undefined)).toBe('/events/edition-x/register?ticket=solo')
    expect(view.registerHref()).toBe('/events/edition-x/register')
  })

  it('handles an event with no ticket yet', () => {
    const view = build([])
    expect(view.lowestPriceCents).toBeNull()
    expect(view.soleTicketId).toBeNull()
    expect(view.galleryImages).toEqual([])
  })

  it('uses race gallery images only, never the hero image', () => {
    const withRace = build([ticket('a', 'OPEN', 100, { gallery_images: ['r1.jpg'] })])
    expect(withRace.galleryImages).toEqual(['r1.jpg'])
    expect(build([ticket('a', 'OPEN', 100)]).galleryImages).toEqual([])
  })
})

describe('describeTicketDeparture', () => {
  const wave = (i: number, remaining = 5) => ({ wave_index: i, start_time: '2026-09-12T10:00:00Z', remaining })

  it('RANKED is a single departure at the configured time', () => {
    const d = describeTicketDeparture({ ticket: ticket('b', 'Pass RANKED', 1), waves: undefined, rankedLabel: '08:00' })
    expect(d).toEqual({ kind: 'single', label: '08:00', waveIndex: null, full: false })
  })

  it('OPEN ticket waits for the overview before choosing a presentation', () => {
    expect(describeTicketDeparture({ ticket: ticket('a', 'Pass OPEN', 1), waves: undefined, rankedLabel: '08:00' }).kind).toBe('loading')
  })

  it('many slots → slots, one slot → single with its wave', () => {
    const many = describeTicketDeparture({ ticket: ticket('a', 'OPEN', 1), waves: [wave(1), wave(2)], rankedLabel: '08:00' })
    expect(many.kind).toBe('slots')
    const one = describeTicketDeparture({ ticket: ticket('a', 'OPEN', 1), waves: [wave(3, 0)], rankedLabel: '08:00' })
    expect(one).toMatchObject({ kind: 'single', waveIndex: 3, full: true })
  })

  it('ticket without departure info is a single button with no invented time', () => {
    expect(describeTicketDeparture({ ticket: ticket('c', 'Pass', 1), waves: [], rankedLabel: '08:00' })).toEqual({
      kind: 'single',
      label: null,
      waveIndex: null,
      full: false,
    })
  })
})

describe('splitDepartureWaves', () => {
  const waves = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ wave_index: i + 1, start_time: '2026-09-12T10:00:00Z', remaining: 3 }))

  it('keeps every slot visible up to the limit', () => {
    const { visible, overflow } = splitDepartureWaves(waves(MAX_VISIBLE_DEPARTURES))
    expect(visible).toHaveLength(MAX_VISIBLE_DEPARTURES)
    expect(overflow).toHaveLength(0)
  })

  it('moves the slots beyond the limit to the dropdown, in order', () => {
    const { visible, overflow } = splitDepartureWaves(waves(50))
    expect(visible).toHaveLength(MAX_VISIBLE_DEPARTURES)
    expect(overflow.map((w) => w.wave_index)).toEqual(
      Array.from({ length: 50 - MAX_VISIBLE_DEPARTURES }, (_, i) => MAX_VISIBLE_DEPARTURES + 1 + i),
    )
  })
})
