import { describe, expect, it } from 'vitest'
import { interpretEventDeletionError, parseEventDeletionCounts } from './eventDeletion'

describe('interpretEventDeletionError', () => {
  it('returns 404 when the event is not in the organization', () => {
    expect(interpretEventDeletionError({ message: 'EVENT_NOT_FOUND' })).toEqual({
      status: 404,
      body: { error: 'Événement introuvable' },
    })
  })

  it('returns 409 with the record counts and asks for cancellation when the event has records', () => {
    const failure = interpretEventDeletionError({
      message: 'EVENT_HAS_RECORDS',
      details: JSON.stringify({ registrationsCount: 7, volunteersCount: 2, luckyWheelEntriesCount: 0 }),
    })
    expect(failure.status).toBe(409)
    expect(failure.body).toMatchObject({
      requiresCancellation: true,
      registrationsCount: 7,
      volunteersCount: 2,
      luckyWheelEntriesCount: 0,
    })
  })

  it('still returns 409 without counts when the detail cannot be read', () => {
    const failure = interpretEventDeletionError({ message: 'EVENT_HAS_RECORDS', details: 'not json' })
    expect(failure.status).toBe(409)
    expect(failure.body).toEqual({
      error: expect.stringContaining('ne peut pas être supprimé'),
      requiresCancellation: true,
    })
  })

  it('maps any other database failure to a generic 500 without leaking the message', () => {
    expect(interpretEventDeletionError({ message: 'connection reset by peer' })).toEqual({
      status: 500,
      body: { error: 'Erreur serveur' },
    })
  })
})

describe('parseEventDeletionCounts', () => {
  it('accepts exactly the three numeric counts', () => {
    expect(
      parseEventDeletionCounts(JSON.stringify({ registrationsCount: 1, volunteersCount: 0, luckyWheelEntriesCount: 3 })),
    ).toEqual({ registrationsCount: 1, volunteersCount: 0, luckyWheelEntriesCount: 3 })
  })

  it('rejects a payload with a missing or non-numeric count', () => {
    expect(parseEventDeletionCounts(JSON.stringify({ registrationsCount: '4', volunteersCount: 0, luckyWheelEntriesCount: 0 }))).toBeNull()
    expect(parseEventDeletionCounts(null)).toBeNull()
  })
})
