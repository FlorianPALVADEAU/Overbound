import { describe, expect, it } from 'vitest'
import { buildConsentView, planConsentUpdate, type ConsentList, type ConsentRow } from './reconsent'

const NOW = '2026-11-08T10:00:00.000Z'

const lists: ConsentList[] = [
  { id: 'events', slug: 'events-announcements', name: 'Annonces', description: null },
  { id: 'partners', slug: 'partners-offers', name: 'Partenaires', description: 'Offres' },
  { id: 'news', slug: 'news-blog', name: 'Actualités', description: null },
]

const row = (id: string, list_id: string, subscribed: boolean, source: string | null): ConsentRow => ({
  id,
  list_id,
  subscribed,
  source,
})

describe('buildConsentView', () => {
  it('pre-checks only subscriptions whose consent is traced', () => {
    const view = buildConsentView(lists, [
      row('r1', 'events', true, 'popup-1'),
      row('r2', 'partners', true, 'legacy-unproven'),
      row('r3', 'news', true, null),
    ])

    expect(view.map((choice) => [choice.id, choice.checked])).toEqual([
      ['events', true],
      ['partners', false],
      ['news', false],
    ])
  })

  it('leaves a list without a row unchecked', () => {
    expect(buildConsentView(lists, []).every((choice) => !choice.checked)).toBe(true)
  })
})

describe('planConsentUpdate', () => {
  it('confirms an untraced subscription the person keeps, with the re-consent source', () => {
    const plan = planConsentUpdate(lists, [row('r1', 'events', true, 'legacy-unproven')], ['events'], NOW)

    expect(plan.updates).toEqual([
      {
        id: 'r1',
        patch: { subscribed: true, source: 'reconsent', subscribed_at: NOW, unsubscribed_at: null },
      },
    ])
    expect(plan.inserts).toEqual([])
  })

  it('keeps the original proof of a traced subscription the person keeps', () => {
    const plan = planConsentUpdate(lists, [row('r1', 'events', true, 'popup-1')], ['events'], NOW)

    expect(plan).toEqual({ updates: [], inserts: [] })
  })

  it('unsubscribes every list the person leaves unchecked', () => {
    const plan = planConsentUpdate(
      lists,
      [row('r1', 'events', true, 'legacy-unproven'), row('r2', 'partners', true, 'popup-1')],
      [],
      NOW,
    )

    expect(plan.updates).toEqual([
      { id: 'r1', patch: { subscribed: false, unsubscribed_at: NOW } },
      { id: 'r2', patch: { subscribed: false, unsubscribed_at: NOW } },
    ])
  })

  it('inserts a subscription for a list that had no row', () => {
    const plan = planConsentUpdate(lists, [], ['news'], NOW)

    expect(plan.inserts).toEqual([
      { list_id: 'news', subscribed: true, source: 'reconsent', subscribed_at: NOW },
    ])
  })

  it('re-subscribes a row that was unsubscribed when the person now accepts', () => {
    const plan = planConsentUpdate(lists, [row('r1', 'events', false, 'preferences')], ['events'], NOW)

    expect(plan.updates).toHaveLength(1)
    expect(plan.updates[0].patch.subscribed).toBe(true)
  })

  it('ignores ids that are not active lists', () => {
    const plan = planConsentUpdate(lists, [], ['unknown'], NOW)

    expect(plan).toEqual({ updates: [], inserts: [] })
  })

  it('does nothing for a list already unsubscribed and left unchecked', () => {
    const plan = planConsentUpdate(lists, [row('r1', 'events', false, 'preferences')], [], NOW)

    expect(plan).toEqual({ updates: [], inserts: [] })
  })
})
