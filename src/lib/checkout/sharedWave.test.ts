import { describe, expect, it } from 'vitest'
import { participantsToAlign } from './sharedWave'
import { participant } from './testDraft'

describe('participantsToAlign', () => {
  const group = [
    participant({ id: 'a', selectedWaveIndex: 4 }),
    participant({ id: 'b', selectedWaveIndex: null }),
    participant({ id: 'c', selectedWaveIndex: 4 }),
    participant({ id: 'd', ticketId: 'other', selectedWaveIndex: null }),
  ]

  it('lists the others on the same ticket who are not on the same SAS yet', () => {
    expect(participantsToAlign(group, 'a')).toEqual(['b'])
  })

  it('lists nobody while the source has no SAS', () => {
    expect(participantsToAlign(group, 'b')).toEqual([])
  })
})
