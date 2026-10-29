import { beforeEach, describe, expect, it, vi } from 'vitest'

const { resolveAudienceMock } = vi.hoisted(() => ({ resolveAudienceMock: vi.fn() }))

vi.mock('@/lib/email/audience', () => ({ resolveAudience: resolveAudienceMock }))

import { buildUnifiedCampaignAudience, mergeAudienceEntries } from './adminCampaigns'

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

describe('adminCampaigns.buildUnifiedCampaignAudience', () => {
  beforeEach(() => vi.clearAllMocks())

  it('builds the campaign audience from the Supabase audience only', async () => {
    resolveAudienceMock.mockResolvedValue([
      { userId: 'u1', email: 'alice@example.com', fullName: 'Alice' },
      { userId: null, email: 'bob@example.com', fullName: null },
    ])

    const { recipients, stats } = await buildUnifiedCampaignAudience()

    expect(resolveAudienceMock).toHaveBeenCalledWith()
    expect(recipients.map((r) => r.email)).toEqual(['alice@example.com', 'bob@example.com'])
    expect(recipients[0]?.userId).toBe('u1')
    expect(recipients[1]?.userId).toBeUndefined()
    expect(stats.sourceCounts).toEqual({ auth: 0, list_subscriptions: 2 })
  })

  it('does not fall back to every account when the audience cannot be read', async () => {
    resolveAudienceMock.mockRejectedValue(new Error('db down'))

    await expect(buildUnifiedCampaignAudience()).rejects.toThrow('db down')
  })
})
