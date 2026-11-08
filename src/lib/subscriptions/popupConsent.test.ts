import { describe, expect, it } from 'vitest'
import { selectPopupConsentLists } from './popupConsent'

const lists = [
  { id: '1', slug: 'events-announcements' },
  { id: '2', slug: 'price-alerts' },
  { id: '3', slug: 'news-blog' },
  { id: '4', slug: 'partners-offers' },
  { id: '5', slug: 'volunteers-recruitment' },
]

describe('selectPopupConsentLists', () => {
  it('keeps the lists the popup promises', () => {
    expect(selectPopupConsentLists(lists).map((l) => l.slug)).toEqual([
      'events-announcements',
      'price-alerts',
      'news-blog',
    ])
  })

  it('never includes partner offers or volunteer recruitment', () => {
    const slugs = selectPopupConsentLists(lists).map((l) => l.slug)
    expect(slugs).not.toContain('partners-offers')
    expect(slugs).not.toContain('volunteers-recruitment')
  })

  it('returns nothing when no promised list exists', () => {
    expect(selectPopupConsentLists([{ id: '9', slug: 'other' }])).toEqual([])
  })
})
