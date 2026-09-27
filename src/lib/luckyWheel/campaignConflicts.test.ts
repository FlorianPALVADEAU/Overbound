import { describe, expect, it } from 'vitest'
import { findCampaignConflicts } from './campaignConflicts'

describe('findCampaignConflicts', () => {
  it('refuses when another campaign overlaps on a shared event', () => {
    const conflicts = findCampaignConflicts({
      candidate: {
        id: 'new',
        event_ids: ['event-1'],
        starts_at: '2026-10-01T00:00:00Z',
        ends_at: '2026-10-10T00:00:00Z',
      },
      otherActiveCampaigns: [
        {
          id: 'existing',
          name: 'Existing campaign',
          event_ids: ['event-1'],
          starts_at: '2026-10-05T00:00:00Z',
          ends_at: '2026-10-15T00:00:00Z',
        },
      ],
      activePopupPromotions: [],
    })

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toMatchObject({ severity: 'refuse', kind: 'campaign' })
  })

  it('reports nothing for two campaigns on disjoint events', () => {
    const conflicts = findCampaignConflicts({
      candidate: {
        id: 'new',
        event_ids: ['event-1'],
        starts_at: '2026-10-01T00:00:00Z',
        ends_at: '2026-10-10T00:00:00Z',
      },
      otherActiveCampaigns: [
        {
          id: 'existing',
          name: 'Existing campaign',
          event_ids: ['event-2'],
          starts_at: '2026-10-05T00:00:00Z',
          ends_at: '2026-10-15T00:00:00Z',
        },
      ],
      activePopupPromotions: [],
    })

    expect(conflicts).toHaveLength(0)
  })

  it('warns, never refuses, on an overlapping popup promotion', () => {
    const conflicts = findCampaignConflicts({
      candidate: {
        id: 'new',
        event_ids: ['event-1'],
        starts_at: '2026-10-01T00:00:00Z',
        ends_at: '2026-10-10T00:00:00Z',
      },
      otherActiveCampaigns: [],
      activePopupPromotions: [
        {
          id: 'promo-1',
          title: 'Newsletter popup',
          starts_at: '2026-10-03T00:00:00Z',
          ends_at: '2026-10-04T00:00:00Z',
        },
      ],
    })

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toMatchObject({ severity: 'warn', kind: 'promotion' })
  })

  it('ignores a non-overlapping promotion window entirely', () => {
    const conflicts = findCampaignConflicts({
      candidate: {
        id: 'new',
        event_ids: ['event-1'],
        starts_at: '2026-10-01T00:00:00Z',
        ends_at: '2026-10-10T00:00:00Z',
      },
      otherActiveCampaigns: [],
      activePopupPromotions: [
        {
          id: 'promo-1',
          title: 'Unrelated promo',
          starts_at: '2027-01-01T00:00:00Z',
          ends_at: '2027-01-02T00:00:00Z',
        },
      ],
    })

    expect(conflicts).toHaveLength(0)
  })

  it('excludes the candidate itself when it appears among other active campaigns', () => {
    const conflicts = findCampaignConflicts({
      candidate: {
        id: 'same-id',
        event_ids: ['event-1'],
        starts_at: '2026-10-01T00:00:00Z',
        ends_at: '2026-10-10T00:00:00Z',
      },
      otherActiveCampaigns: [
        {
          id: 'same-id',
          name: 'Itself, from a stale query',
          event_ids: ['event-1'],
          starts_at: '2026-10-01T00:00:00Z',
          ends_at: '2026-10-10T00:00:00Z',
        },
      ],
      activePopupPromotions: [],
    })

    expect(conflicts).toHaveLength(0)
  })
})
