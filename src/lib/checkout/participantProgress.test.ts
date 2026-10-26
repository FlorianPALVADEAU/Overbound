import { describe, expect, it } from 'vitest'
import { countComplete, nextIncompleteParticipantId } from './participantProgress'

const ids = ['a', 'b', 'c', 'd']

describe('nextIncompleteParticipantId', () => {
  it('skips complete participants after the current one', () => {
    expect(nextIncompleteParticipantId(ids, { b: true }, 'a')).toBe('c')
  })

  it('wraps around to an earlier incomplete participant', () => {
    expect(nextIncompleteParticipantId(ids, { a: false, b: true, c: true, d: true }, 'd')).toBe('a')
  })

  it('starts from the first when nothing is open', () => {
    expect(nextIncompleteParticipantId(ids, { a: true }, null)).toBe('b')
  })

  it('returns null when everyone else is complete', () => {
    expect(nextIncompleteParticipantId(ids, { a: true, b: true, c: true, d: true }, 'a')).toBeNull()
  })
})

describe('countComplete', () => {
  it('counts the complete participants', () => {
    expect(countComplete(ids, { a: true, c: true, d: false })).toBe(2)
  })
})
