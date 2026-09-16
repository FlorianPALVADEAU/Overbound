import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PARTICIPANT_URL_STATE,
  parseParticipantUrlState,
  writeParticipantUrlState,
} from './participantUrlState'

describe('participant URL state', () => {
  it('parses supported state and keeps the event context separate from query state', () => {
    const state = parseParticipantUrlState(
      new URLSearchParams('sort=email&direction=asc&check_in=checked_in&cursor=abc&limit=100'),
      'event-1',
    )

    expect(state).toEqual({
      eventId: 'event-1',
      sort: 'email',
      direction: 'asc',
      checkIn: 'checked_in',
      cursor: 'abc',
      limit: 100,
    })
  })

  it('falls back safely for unknown values', () => {
    expect(parseParticipantUrlState(new URLSearchParams('sort=name&direction=sideways&limit=999'))).toEqual({
      ...DEFAULT_PARTICIPANT_URL_STATE,
      eventId: undefined,
    })
  })

  it('serializes operational state without PII search parameters', () => {
    const query = writeParticipantUrlState(
      new URLSearchParams('view=participants&query=alice@example.com&search_term=alice'),
      {
        sort: 'email',
        direction: 'asc',
        checkIn: 'not_checked_in',
        cursor: 'next-page',
        limit: 100,
      },
    )

    expect(query).toBe('view=participants&sort=email&direction=asc&check_in=not_checked_in&cursor=next-page&limit=100')
    expect(query).not.toContain('alice')
  })

  it('omits defaults to keep copied URLs short and stable', () => {
    expect(writeParticipantUrlState(new URLSearchParams(), DEFAULT_PARTICIPANT_URL_STATE)).toBe('')
  })
})
