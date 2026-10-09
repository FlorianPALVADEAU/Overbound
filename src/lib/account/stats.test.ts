import { describe, expect, it } from 'vitest'
import { bucketDepartures, buildGroupStats, buildRunnerStats, departureSlot, type StatsRegistration } from './stats'

const make = (overrides: Partial<StatsRegistration> = {}): StatsRegistration => ({
  userId: 'u1',
  email: 'me@x.com',
  eventId: 'e1',
  eventTitle: 'Ultra Arena',
  eventDate: '2026-09-12T06:00:00Z',
  format: 'open',
  startTime: '2026-09-12T10:20:00Z',
  checkedIn: false,
  ...overrides,
})

describe('buildRunnerStats', () => {
  it('splits own bibs from bibs bought for friends', () => {
    const stats = buildRunnerStats([make(), make({ email: 'f@x.com' }), make({ email: 'g@x.com' })], 'me@x.com')
    expect(stats.bibs).toBe(3)
    expect(stats.ownBibs).toBe(1)
    expect(stats.bibsForOthers).toBe(2)
  })

  it('splits formats and counts check-ins', () => {
    const stats = buildRunnerStats([make(), make({ format: 'ranked', checkedIn: true }), make({ format: null })], 'me@x.com')
    expect(stats.byFormat).toEqual({ open: 1, ranked: 1, other: 1 })
    expect(stats.checkedIn).toBe(1)
  })

  it('builds a dated timeline per event and handles no registration', () => {
    const stats = buildRunnerStats(
      [make({ eventId: 'b', eventTitle: 'B', eventDate: '2027-01-01T00:00:00Z' }), make({ eventId: 'a', eventTitle: 'A', eventDate: '2026-01-01T00:00:00Z' })],
      null,
    )
    expect(stats.timeline.map((entry) => entry.eventId)).toEqual(['a', 'b'])
    expect(stats.editions).toBe(2)
    expect(buildRunnerStats([], 'me@x.com')).toMatchObject({ editions: 0, bibs: 0, timeline: [] })
  })
})

describe('departure buckets', () => {
  it('rounds down to the half hour in Paris time', () => {
    expect(departureSlot('2026-09-12T10:20:00Z')).toBe('12:00')
    expect(departureSlot('2026-09-12T10:45:00Z')).toBe('12:30')
    expect(departureSlot('garbage')).toBeNull()
  })

  it('counts and sorts, skipping empty times', () => {
    expect(bucketDepartures(['2026-09-12T11:00:00Z', null, '2026-09-12T10:10:00Z', '2026-09-12T10:25:00Z'])).toEqual([
      { slot: '12:00', count: 2 },
      { slot: '13:00', count: 1 },
    ])
  })
})

describe('buildGroupStats', () => {
  const rows = [
    make({ userId: 'm1' }),
    make({ userId: 'm2', format: 'ranked', checkedIn: true }),
    make({ userId: 'outsider' }),
    make({ userId: 'm1', eventId: 'old', eventTitle: 'Old', eventDate: '2025-01-01T00:00:00Z' }),
  ]

  it('only counts members, on the latest event by default', () => {
    const stats = buildGroupStats(rows, ['m1', 'm2', 'm3'], null)
    expect(stats.event?.id).toBe('e1')
    expect(stats.memberCount).toBe(3)
    expect(stats.registeredMembers).toBe(2)
    expect(stats.bibs).toBe(2)
    expect(stats.checkedIn).toBe(1)
  })

  it('uses the anchor event when given, and is empty without member registrations', () => {
    expect(buildGroupStats(rows, ['m1'], 'old').event?.id).toBe('old')
    expect(buildGroupStats(rows, ['nobody'], null)).toMatchObject({ event: null, registeredMembers: 0, bibs: 0, departures: [] })
  })
})
