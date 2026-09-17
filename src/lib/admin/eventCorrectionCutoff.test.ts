import { describe, expect, it } from 'vitest'
import { getEventCorrectionCutoff } from './eventCorrectionCutoff'

describe('getEventCorrectionCutoff', () => {
  const eventStart = '2026-09-20T08:00:00.000Z' // 10:00 Europe/Paris

  it('allows corrections before local midnight on J-1', () => {
    const result = getEventCorrectionCutoff({ eventStart, now: new Date('2026-09-18T21:59:59.999Z') })
    expect(result.allowed).toBe(true)
    expect(result.cutoffAt).toBe('2026-09-18T22:00:00.000Z')
    expect(result.blocker).toBeNull()
  })

  it('blocks at local midnight on J-1, including the full J-1 day', () => {
    const result = getEventCorrectionCutoff({ eventStart, now: new Date('2026-09-18T22:00:00.000Z') })
    expect(result.allowed).toBe(false)
    expect(result.blocker).toContain('J-1 inclus')
  })

  it('uses the event timezone when it is provided', () => {
    const result = getEventCorrectionCutoff({ eventStart, timeZone: 'America/New_York', now: new Date('2026-09-19T03:59:59.999Z') })
    expect(result.allowed).toBe(true)
    expect(result.cutoffAt).toBe('2026-09-19T04:00:00.000Z')
  })

  it('fails closed for a missing event date', () => {
    const result = getEventCorrectionCutoff({ eventStart: null, now: new Date('2026-09-18T12:00:00.000Z') })
    expect(result.allowed).toBe(false)
    expect(result.blocker).toContain('date de début')
  })
})
