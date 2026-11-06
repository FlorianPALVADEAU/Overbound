import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PARTICIPANT_URL_STATE,
  parseParticipantUrlState,
  writeParticipantUrlState,
} from './participantUrlState'

describe('participant URL state', () => {
  it('parses supported state and keeps the event context separate from query state', () => {
    const state = parseParticipantUrlState(
      new URLSearchParams('sort=email&direction=asc&check_in=checked_in&cursor=abc&limit=100&selected=registration-1'),
      'event-1',
    )

    expect(state).toEqual({
      eventId: 'event-1',
      sort: 'email',
      direction: 'asc',
      checkIn: 'checked_in',
      status: 'all',
      ticketId: null,
      wave: null,
      sex: 'all',
      cursor: 'abc',
      limit: 100,
      selectedId: 'registration-1',
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
        status: 'all',
        ticketId: null,
        wave: null,
        sex: 'all',
        cursor: 'next-page',
        limit: 100,
        selectedId: 'registration-1',
      },
    )

    expect(query).toBe('view=participants&sort=email&direction=asc&check_in=not_checked_in&cursor=next-page&limit=100&selected=registration-1')
    expect(query).not.toContain('alice')
  })

  it('keeps the ticket, SAS and status filters in the URL', () => {
    const ticketId = '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'
    const state = parseParticipantUrlState(new URLSearchParams(`ticket=${ticketId}&wave=none&status=cancelled`))
    expect(state).toMatchObject({ ticketId, wave: 'none', status: 'cancelled' })
    const query = writeParticipantUrlState(new URLSearchParams(), { ...DEFAULT_PARTICIPANT_URL_STATE, ticketId, wave: '7', status: 'active' })
    expect(query).toBe(`status=active&ticket=${ticketId}&wave=7`)
  })

  it('ignores a malformed ticket or SAS', () => {
    const state = parseParticipantUrlState(new URLSearchParams('ticket=nope&wave=abc&status=weird'))
    expect(state).toMatchObject({ ticketId: null, wave: null, status: 'all' })
  })

  it('omits defaults to keep copied URLs short and stable', () => {
    expect(writeParticipantUrlState(new URLSearchParams(), DEFAULT_PARTICIPANT_URL_STATE)).toBe('')
  })

  it('keeps the sex filter in the URL, and leaves it out when it is not set', () => {
    expect(parseParticipantUrlState(new URLSearchParams('sex=femme'))).toMatchObject({ sex: 'femme' })
    expect(parseParticipantUrlState(new URLSearchParams('sex=none'))).toMatchObject({ sex: 'none' })
    expect(parseParticipantUrlState(new URLSearchParams('sex=autre'))).toMatchObject({ sex: 'all' })

    const withSex = writeParticipantUrlState(new URLSearchParams(), { ...DEFAULT_PARTICIPANT_URL_STATE, sex: 'homme' })
    expect(withSex).toBe('sex=homme')
    expect(writeParticipantUrlState(new URLSearchParams('sex=homme'), { ...DEFAULT_PARTICIPANT_URL_STATE, sex: 'all' })).toBe('')
  })
})
