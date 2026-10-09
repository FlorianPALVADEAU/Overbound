import { describe, expect, it } from 'vitest'
import { selectFeaturedEvent } from './featuredEvent'

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
