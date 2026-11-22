import { describe, expect, it } from 'vitest'
import { isoToParisInput, parisInputToIso } from './dateTimeInput'

describe('parisInputToIso', () => {
  it('reads the typed wall clock as Paris time in winter (UTC+1)', () => {
    // 1 December 2026 at 07:00 in Paris is 06:00 UTC.
    expect(parisInputToIso('2026-12-01T07:00')).toBe('2026-12-01T06:00:00.000Z')
  })

  it('reads the typed wall clock as Paris time in summer (UTC+2)', () => {
    expect(parisInputToIso('2027-04-24T08:00')).toBe('2027-04-24T06:00:00.000Z')
  })

  it('handles the day the clocks change', () => {
    // Last Sunday of March 2027: the clocks jump from 02:00 to 03:00 in Paris.
    expect(parisInputToIso('2027-03-28T03:30')).toBe('2027-03-28T01:30:00.000Z')
    // Last Sunday of October 2026: 02:30 happens twice; the first occurrence is summer time.
    expect(parisInputToIso('2026-10-25T10:00')).toBe('2026-10-25T09:00:00.000Z')
  })

  it('refuses incomplete text and days that do not exist', () => {
    expect(parisInputToIso('')).toBeNull()
    expect(parisInputToIso('2026-12-01')).toBeNull()
    expect(parisInputToIso('2026-02-30T10:00')).toBeNull()
    expect(parisInputToIso(undefined)).toBeNull()
  })
})

describe('isoToParisInput', () => {
  it('shows Paris wall clock, not UTC digits', () => {
    // Stored as 06:00 UTC: the admin must see 07:00.
    expect(isoToParisInput('2026-12-01T06:00:00.000Z')).toBe('2026-12-01T07:00')
    expect(isoToParisInput('2027-04-24T06:00:00.000Z')).toBe('2027-04-24T08:00')
  })

  it('returns empty text for missing or invalid values', () => {
    expect(isoToParisInput(null)).toBe('')
    expect(isoToParisInput('not a date')).toBe('')
  })

  it('round trips: saving what the form showed does not move the instant', () => {
    for (const iso of ['2026-12-01T06:00:00.000Z', '2027-04-24T06:00:00.000Z', '2027-03-28T01:30:00.000Z']) {
      expect(parisInputToIso(isoToParisInput(iso))).toBe(iso)
    }
  })
})
