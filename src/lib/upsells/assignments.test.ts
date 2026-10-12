import { describe, expect, it } from 'vitest'
import {
  pruneAssignments,
  readAssignments,
  setParticipantQuantity,
  toRequestAssignments,
  totalQuantity,
  upsellMaxPerParticipant,
  validateUpsellAssignments,
} from './assignments'

describe('setParticipantQuantity', () => {
  it('targets the chosen participant only', () => {
    const afterSeven = setParticipantQuantity([], 'p7', 1, 1)
    expect(afterSeven).toEqual([{ participantId: 'p7', quantity: 1 }])
    expect(setParticipantQuantity(afterSeven, 'p1', 1, 1).map((entry) => entry.participantId)).toEqual(['p7', 'p1'])
  })

  it('removes a participant at 0 and caps at the maximum', () => {
    const one = setParticipantQuantity([], 'p1', 5, upsellMaxPerParticipant('patch'))
    expect(one[0].quantity).toBe(2)
    expect(setParticipantQuantity(one, 'p1', 0, 2)).toEqual([])
  })

  it('keeps the size when only the quantity changes', () => {
    const sized = setParticipantQuantity([], 'p1', 1, 1, 'M')
    expect(setParticipantQuantity(sized, 'p1', 1, 1)[0].size).toBe('M')
  })
})

describe('readAssignments', () => {
  it('ignores legacy ticket-id lists and malformed entries', () => {
    expect(readAssignments({ assignments: ['ticket-1', { participantId: 'p1', quantity: 0 }, null] })).toEqual([])
    expect(readAssignments(undefined)).toEqual([])
  })
})

describe('pruneAssignments / toRequestAssignments', () => {
  it('drops participants who left the order', () => {
    const kept = pruneAssignments(
      [{ participantId: 'p1', quantity: 1 }, { participantId: 'p9', quantity: 1 }],
      ['p1', 'p2'],
      1,
    )
    expect(kept).toEqual([{ participantId: 'p1', quantity: 1 }])
  })

  it('maps participant ids to their position in the order', () => {
    const request = toRequestAssignments([{ participantId: 'p2', quantity: 1, size: 'L' }], ['p1', 'p2'])
    expect(request).toEqual([{ participantIndex: 1, quantity: 1, size: 'L' }])
    expect(totalQuantity([{ participantId: 'p2', quantity: 3 }])).toBe(3)
  })
})

describe('validateUpsellAssignments', () => {
  const products = new Map([['tshirt', { type: 'tshirt' as const }], ['patch', { type: 'patch' as const }]])

  it('accepts a matching distribution', () => {
    expect(
      validateUpsellAssignments(
        [{ upsellId: 'tshirt', quantity: 2, meta: { assignments: [{ participantIndex: 0, quantity: 1 }, { participantIndex: 2, quantity: 1 }] } }],
        products,
        3,
      ),
    ).toBeNull()
  })

  it('accepts selections without assignments (older clients)', () => {
    expect(validateUpsellAssignments([{ upsellId: 'tshirt', quantity: 1, meta: {} }], products, 1)).toBeNull()
  })

  it.each([
    ['an unknown participant', { upsellId: 'tshirt', quantity: 1, meta: { assignments: [{ participantIndex: 5, quantity: 1 }] } }],
    ['the same participant twice', { upsellId: 'tshirt', quantity: 2, meta: { assignments: [{ participantIndex: 0, quantity: 1 }, { participantIndex: 0, quantity: 1 }] } }],
    ['more than the per-participant limit', { upsellId: 'tshirt', quantity: 2, meta: { assignments: [{ participantIndex: 0, quantity: 2 }] } }],
    ['a total that does not match', { upsellId: 'patch', quantity: 3, meta: { assignments: [{ participantIndex: 0, quantity: 2 }] } }],
  ])('rejects %s', (_label, selection) => {
    expect(validateUpsellAssignments([selection], products, 2)).not.toBeNull()
  })
})
