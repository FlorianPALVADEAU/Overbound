import { describe, expect, it } from 'vitest'
import { summarizeOrderRegistrations } from './orderSummary'

describe('summarizeOrderRegistrations', () => {
  it('keeps format and start time shared by the whole team', () => {
    const rows = Array.from({ length: 8 }, () => ({ race_format: 'open', start_time: '2026-09-12T11:20:00Z' }))
    expect(summarizeOrderRegistrations(rows)).toEqual({
      count: 8,
      raceFormat: 'open',
      startTime: '2026-09-12T11:20:00Z',
    })
  })

  it('drops format and start time when the team is mixed', () => {
    const summary = summarizeOrderRegistrations([
      { race_format: 'open', start_time: '2026-09-12T11:20:00Z' },
      { race_format: 'ranked', start_time: '2026-09-12T06:00:00Z' },
    ])
    expect(summary).toEqual({ count: 2, raceFormat: null, startTime: null })
  })

  it('handles an empty or unset order', () => {
    expect(summarizeOrderRegistrations([])).toEqual({ count: 0, raceFormat: null, startTime: null })
    expect(summarizeOrderRegistrations([{}])).toEqual({ count: 1, raceFormat: null, startTime: null })
  })
})
