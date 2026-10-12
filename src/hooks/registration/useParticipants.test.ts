import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useParticipants } from './useParticipants'

const buyer = { id: 'user-1', email: 'camille@example.com', fullName: 'Camille Martin', date_of_birth: '1990-05-04' }

describe('useParticipants', () => {
  it('prefills only the first bib with the buyer account', () => {
    const { result, rerender } = renderHook(({ slots }) => useParticipants(slots, buyer), { initialProps: { slots: ['open'] } })
    rerender({ slots: ['open', 'open'] })
    expect(result.current.participants.map((p) => [p.firstName, p.email])).toEqual([
      ['Camille', 'camille@example.com'],
      ['', ''],
    ])
  })

  it('re-attaches typed bibs to their slot when a ticket is added before them', () => {
    const { result, rerender } = renderHook(({ slots }) => useParticipants(slots, null), { initialProps: { slots: ['open', 'ranked'] } })
    act(() => result.current.handleWaveSelection('participant-2', 3))
    rerender({ slots: ['open', 'open', 'ranked'] })
    expect(result.current.participants.map((p) => p.ticketId)).toEqual(['open', 'open', 'ranked'])
    // participant-2 moved from RANKED to OPEN: its old SAS no longer applies.
    expect(result.current.participants[1]?.selectedWaveIndex).toBeNull()
  })

  it('keeps a SAS while the bib stays on its ticket', () => {
    const { result, rerender } = renderHook(({ slots }) => useParticipants(slots, null), { initialProps: { slots: ['open'] } })
    act(() => result.current.handleWaveSelection('participant-1', 5))
    rerender({ slots: ['open', 'ranked'] })
    expect(result.current.participants[0]?.selectedWaveIndex).toBe(5)
  })
})
