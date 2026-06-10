import { describe, expect, it } from 'vitest'
import { mergeAudienceEntries } from './adminCampaigns'

describe('adminCampaigns.mergeAudienceEntries', () => {
  it('deduplicates recipients across auth and list subscriptions', () => {
    const { recipients, stats } = mergeAudienceEntries([
      { email: 'Alice@Example.com', userId: 'u1', fullName: 'Alice', source: 'auth' },
      { email: 'alice@example.com', userId: 'u1', fullName: null, source: 'list_subscriptions' },
      { email: 'bob@example.com', source: 'list_subscriptions' },
    ])

    expect(recipients).toHaveLength(2)
    expect(recipients[0]?.email).toBe('alice@example.com')
    expect(recipients[1]?.email).toBe('bob@example.com')
    expect(recipients[0]?.sources).toEqual(['auth', 'list_subscriptions'])
    expect(stats.totalUnique).toBe(2)
    expect(stats.duplicatesCollapsed).toBe(1)
  })

  it('skips invalid or empty emails', () => {
    const { recipients, stats } = mergeAudienceEntries([
      { email: '', source: 'auth' },
      { email: 'not-an-email', source: 'list_subscriptions' },
      { email: 'valid@example.com', source: 'auth' },
    ])

    expect(recipients).toHaveLength(1)
    expect(recipients[0]?.email).toBe('valid@example.com')
    expect(stats.invalidEmailSkipped).toBe(2)
  })
})
