import { describe, expect, it } from 'vitest'
import { buildTicketChangePreview } from './ticketChangePreview'

const base = {
  registration: { eventId: 'event-1', waveIndex: 3, startTime: '2026-09-20T12:20:00Z' },
  currentTicket: { id: 'ticket-1', eventId: 'event-1', name: 'Trail OPEN', raceName: 'Trail', priceCents: 5000, currency: 'eur' },
  targetTicket: { id: 'ticket-2', eventId: 'event-1', name: 'Trail RANKED', raceName: 'Trail', priceCents: 5000, currency: 'eur' },
}

describe('buildTicketChangePreview', () => {
  it('describes an OPEN to RANKED change without mutating state', () => {
    const preview = buildTicketChangePreview(base)
    expect(preview.allowed).toBe(true)
    expect(preview.current.format).toBe('OPEN')
    expect(preview.target.format).toBe('RANKED')
    expect(preview.impacts.sas).toBe('cleared')
    expect(preview.impacts.financial.status).toBe('no_change')
    expect(preview.previewId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(new Date(preview.expiresAt).getTime()).toBeGreaterThan(Date.now())
    expect(preview.sourceVersion).toHaveLength(16)
  })

  it('blocks a ticket from another event and flags a price difference', () => {
    const preview = buildTicketChangePreview({
      ...base,
      targetTicket: { ...base.targetTicket, eventId: 'event-2', priceCents: 6500 },
    })
    expect(preview.allowed).toBe(false)
    expect(preview.blockers).toContain('Le billet actuel et le billet cible doivent appartenir au même événement.')
    expect(preview.impacts.financial.status).toBe('potential_change')
    expect(preview.allowed).toBe(false)
    expect(preview.blockers.some((blocker) => blocker.includes('Impact financier différent'))).toBe(true)
  })

  it('blocks previews when the financial impact cannot be calculated', () => {
    const preview = buildTicketChangePreview({
      ...base,
      targetTicket: { ...base.targetTicket, priceCents: null },
    })
    expect(preview.allowed).toBe(false)
    expect(preview.impacts.financial.status).toBe('unknown')
    expect(preview.blockers).toContain('Impact financier non calculable : la politique financière doit être validée avant toute mutation.')
  })

  it('uses the group anchor when moving to OPEN', () => {
    const preview = buildTicketChangePreview({
      ...base,
      currentTicket: { ...base.currentTicket, name: 'Trail RANKED' },
      targetTicket: { ...base.targetTicket, name: 'Trail OPEN' },
      registration: { eventId: 'event-1', waveIndex: null, startTime: '2026-09-20T08:00:00Z' },
      group: { name: 'Team A', anchorEventId: 'event-1', anchorWaveIndex: 8, anchorStartTime: '2026-09-20T13:10:00Z' },
    })
    expect(preview.target.waveIndex).toBe(8)
    expect(preview.impacts.group).toBe('anchor_applies')
  })
})
