import { describe, expect, it } from 'vitest'
import {
  decodeParticipantsCursor,
  encodeParticipantsCursor,
  getParticipantFormat,
} from './eventParticipants'

describe('participants cursor', () => {
  it('round-trips a cursor bound to its sort order', () => {
    const cursor = encodeParticipantsCursor({
      sort: 'created_at',
      id: '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9',
    })

    expect(decodeParticipantsCursor(cursor, 'created_at')).toEqual({
      sort: 'created_at',
      id: '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9',
    })
  })

  it('rejects malformed or incompatible cursors', () => {
    expect(() => decodeParticipantsCursor('not-a-cursor', 'created_at')).toThrow(
      'Cursor de pagination invalide',
    )

    const emailCursor = encodeParticipantsCursor({
      sort: 'email',
      id: '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9',
    })

    expect(() => decodeParticipantsCursor(emailCursor, 'created_at')).toThrow(
      'Cursor incompatible avec le tri demandé',
    )
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
