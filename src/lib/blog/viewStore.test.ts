import { describe, expect, it } from 'vitest'
import { recordBlogView, type BlogViewStore } from './viewStore'
import { VIEW_CAP_PER_PREFIX_PER_HOUR } from './views'

const HUMAN_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15'
const VISIT = '4f1c2a9e-7b3d-4e8a-9c2f-1a2b3c4d5e6f'
const NOW = new Date('2026-11-05T12:00:00Z')

interface FakeStore extends BlogViewStore {
  inserted: Array<{ postSlug: string; visitId: string; anonIp: string | null }>
}

const fakeStore = (recentVisits = 0): FakeStore => {
  const inserted: FakeStore['inserted'] = []
  return {
    inserted,
    countVisitsSince: async () => recentVisits,
    insertVisit: async (row) => {
      inserted.push(row)
    },
    countViewsByPostSince: async () => new Map(),
  }
}

describe('recordBlogView', () => {
  it('enregistre une visite humaine avec l’IP anonymisée', async () => {
    const store = fakeStore()
    const result = await recordBlogView(store, {
      slug: 'overbound-vision-moyen-terme',
      visitId: VISIT,
      forwardedFor: '203.0.113.42, 10.0.0.1',
      userAgent: HUMAN_UA,
      now: NOW,
    })
    expect(result).toBe('recorded')
    expect(store.inserted).toEqual([
      { postSlug: 'overbound-vision-moyen-terme', visitId: VISIT, anonIp: '203.0.113.0' },
    ])
  })

  it('ne compte pas un robot', async () => {
    const store = fakeStore()
    const result = await recordBlogView(store, {
      slug: 'overbound-vision-moyen-terme',
      visitId: VISIT,
      forwardedFor: '203.0.113.42',
      userAgent: 'Googlebot/2.1',
      now: NOW,
    })
    expect(result).toBe('filtered')
    expect(store.inserted).toHaveLength(0)
  })

  it('ne compte plus une fois le plafond horaire du préfixe atteint', async () => {
    const store = fakeStore(VIEW_CAP_PER_PREFIX_PER_HOUR)
    const result = await recordBlogView(store, {
      slug: 'overbound-vision-moyen-terme',
      visitId: VISIT,
      forwardedFor: '203.0.113.42',
      userAgent: HUMAN_UA,
      now: NOW,
    })
    expect(result).toBe('capped')
    expect(store.inserted).toHaveLength(0)
  })
})
