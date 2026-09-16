import { describe, expect, it } from 'vitest'
import {
  decodeParticipantsCursor,
  encodeParticipantsCursor,
  getParticipantFormat,
} from './eventParticipants'

describe('participants cursor', () => {
  it('round-trips a cursor bound to its sort order', () => {
    const cursor = encodeParticipantsCursor({
      eventId: '56e08f7d-24c3-44be-b123-4f034c669909',
      sort: 'created_at',
      direction: 'desc',
      id: '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9',
    })

    expect(decodeParticipantsCursor(
      cursor,
      '56e08f7d-24c3-44be-b123-4f034c669909',
      'created_at',
      'desc',
    )).toEqual({
      eventId: '56e08f7d-24c3-44be-b123-4f034c669909',
      sort: 'created_at',
      direction: 'desc',
      id: '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9',
    })
  })

  it('rejects malformed or incompatible cursors', () => {
    expect(() => decodeParticipantsCursor(
      'not-a-cursor',
      '56e08f7d-24c3-44be-b123-4f034c669909',
      'created_at',
      'desc',
    )).toThrow(
      'Cursor de pagination invalide',
    )

    const emailCursor = encodeParticipantsCursor({
      eventId: '56e08f7d-24c3-44be-b123-4f034c669909',
      sort: 'email',
      direction: 'desc',
      id: '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9',
    })

    expect(() => decodeParticipantsCursor(
      emailCursor,
      '56e08f7d-24c3-44be-b123-4f034c669909',
      'created_at',
      'desc',
    )).toThrow(
      'Cursor incompatible avec le tri demandé',
    )

    expect(() => decodeParticipantsCursor(
      emailCursor,
      '56e08f7d-24c3-44be-b123-4f034c669909',
      'email',
      'asc',
    )).toThrow('Cursor incompatible avec le tri demandé')

    expect(() => decodeParticipantsCursor(
      emailCursor,
      '00000000-0000-0000-0000-000000000000',
      'email',
      'desc',
    )).toThrow('Cursor incompatible avec l’événement demandé')
  })
})

describe('getParticipantFormat', () => {
  it('uses the existing OPEN/RANKED detection contract', () => {
    expect(getParticipantFormat('Ticket Open', null)).toBe('OPEN')
    expect(getParticipantFormat('Ranked 20 km', null)).toBe('RANKED')
  })

  it('does not invent a format when the existing contract cannot classify it', () => {
    expect(getParticipantFormat('Découverte', 'Course loisirs')).toBe('—')
  })
})
