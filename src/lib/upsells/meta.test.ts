import { describe, expect, it } from 'vitest'
import { extractSpecBreakdown } from './meta'

describe('extractSpecBreakdown', () => {
  it('counts t-shirt sizes', () => {
    expect(extractSpecBreakdown({ sizes: ['L', 'XS'] }, 2)).toEqual([
      { label: 'Taille L', quantity: 1 },
      { label: 'Taille XS', quantity: 1 },
    ])
  })

  it('never shows assignments, whether new (objects) or legacy (ticket ids)', () => {
    expect(
      extractSpecBreakdown({ assignments: [{ participantId: 'participant-1', quantity: 1 }] }, 1),
    ).toEqual([])
    expect(extractSpecBreakdown({ assignments: ['915f03dd-2eb8-45f6-bf4c-3e752f01ce7a'], sizes: ['L'] }, 1)).toEqual([
      { label: 'Taille L', quantity: 1 },
    ])
  })
})
