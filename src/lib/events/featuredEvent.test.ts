import { describe, expect, it } from 'vitest'
import { selectFeaturedEvent, selectLastEvent } from './featuredEvent'

const now = new Date('2026-06-01T00:00:00Z')

describe('selectFeaturedEvent', () => {
  it('picks the soonest event open for registration', () => {
    const events = [
      { id: 'later', status: 'on_sale', date: '2026-12-01T00:00:00Z' },
      { id: 'soonest', status: 'on_sale', date: '2026-09-01T00:00:00Z' },
    ]

    const result = selectFeaturedEvent(events, now)

    expect(result?.id).toBe('soonest')
  })

  it('returns null when every event is a draft or fully past with no live status', () => {
    const events = [
      { id: 'draft', status: 'draft', date: '2026-09-01T00:00:00Z' },
      { id: 'closed', status: 'closed', date: '2026-01-01T00:00:00Z' },
    ]

    const result = selectFeaturedEvent(events, now)

    expect(result).toBeNull()
  })

  it('falls back to the soonest announced event when nothing is open yet', () => {
    const events = [
      { id: 'announced', status: 'announced', sales_start: '2026-12-01T00:00:00Z', date: '2027-01-01T00:00:00Z' },
    ]

    const result = selectFeaturedEvent(events, now)

    expect(result?.id).toBe('announced')
  })
})

describe('selectLastEvent', () => {
  it('returns the most recent event, ignoring drafts and cancelled ones', () => {
    const events = [
      { id: 'old', status: 'completed', date: '2025-09-01T00:00:00Z' },
      { id: 'last', status: 'completed', date: '2026-09-12T00:00:00Z' },
      { id: 'draft', status: 'draft', date: '2027-04-01T00:00:00Z' },
      { id: 'cancelled', status: 'cancelled', date: '2027-01-01T00:00:00Z' },
    ]

    expect(selectLastEvent(events)?.id).toBe('last')
  })

  it('returns null when there is no usable event', () => {
    expect(selectLastEvent([{ id: 'draft', status: 'draft', date: '2027-04-01T00:00:00Z' }])).toBeNull()
    expect(selectLastEvent([])).toBeNull()
  })
})
