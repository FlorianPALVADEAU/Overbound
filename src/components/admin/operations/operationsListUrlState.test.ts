import { describe, expect, it } from 'vitest'
import { parseOperationsListUrlState, writeOperationsListUrlState } from './operationsListUrlState'

describe('operations list URL state', () => {
  it('parses supported operational fields and rejects an unsupported limit', () => {
    const state = parseOperationsListUrlState(
      new URLSearchParams('cursor=next&sort=email&direction=asc&limit=3&selected=row-1&filter_status=active'),
      { filterIds: ['status'] },
    )

    expect(state).toEqual({
      cursor: 'next',
      sort: 'email',
      direction: 'asc',
      limit: 50,
      selectedId: 'row-1',
      filters: { status: 'active' },
    })
  })

  it('serializes only provided filter ids and removes default values', () => {
    const result = writeOperationsListUrlState(
      new URLSearchParams('unrelated=kept&filter_ignored=legacy&limit=100'),
      { cursor: null, sort: null, direction: null, limit: 50, selectedId: null, filters: { status: '' } },
      { filterIds: ['status'] },
    )

    expect(result).toBe('unrelated=kept&filter_ignored=legacy')
  })
})
