import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { EventUpsell, Participant } from '@/components/registration/types'
import { readAssignments } from '@/lib/upsells/assignments'
import { useUpsells } from './useUpsells'

const upsell = (id: string, type: EventUpsell['type']): EventUpsell =>
  ({ id, name: id, type, price_cents: 1000, currency: 'eur', is_active: true, options: null }) as unknown as EventUpsell

const UPSELLS = [upsell('photos', 'photos'), upsell('tshirt', 'tshirt'), upsell('patch', 'patch')]

const people = (count: number): Participant[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    ticketId: 'ticket-1', // every participant shares one ticket type, on purpose
    firstName: `Prenom${index + 1}`,
    lastName: 'Test',
  })) as Participant[]

const setup = (count: number) => {
  const participants = people(count)
  return renderHook(() => useUpsells(UPSELLS, participants.map((p) => p.ticketId), participants, 'eur'))
}

describe('useUpsells: options belong to a participant', () => {
  it('picking participant 7 selects participant 7 only, even when all share one ticket type', () => {
    const { result } = setup(7)

    act(() => result.current.setUpsellForParticipant('photos', 'p7', 1))

    expect(readAssignments(result.current.selectedUpsells.photos.meta).map((entry) => entry.participantId)).toEqual(['p7'])
    expect(result.current.selectedUpsells.photos.quantity).toBe(1)
  })

  it('"everyone" adds one per participant in a single move', () => {
    const { result } = setup(50)

    act(() => result.current.setUpsellForAll('photos', 1))
    expect(result.current.selectedUpsells.photos.quantity).toBe(50)

    act(() => result.current.clearUpsell('photos'))
    expect(result.current.selectedUpsells.photos).toBeUndefined()
  })

  it('removes the option when the last participant is unticked (no zero-quantity entry)', () => {
    const { result } = setup(2)
    act(() => result.current.setUpsellForParticipant('patch', 'p1', 2))
    expect(result.current.selectedUpsells.patch.quantity).toBe(2)

    act(() => result.current.setUpsellForParticipant('patch', 'p1', 0))
    expect(result.current.selectedUpsells.patch).toBeUndefined()
  })

  it('never lets one participant take more than the limit', () => {
    const { result } = setup(1)
    act(() => result.current.setUpsellForParticipant('patch', 'p1', 9))
    expect(result.current.selectedUpsells.patch.quantity).toBe(2)
    act(() => result.current.setUpsellForParticipant('photos', 'p1', 5))
    expect(result.current.selectedUpsells.photos.quantity).toBe(1)
  })

  it('gives every t-shirt a size and lets one size be applied to all', () => {
    const { result } = setup(3)
    act(() => result.current.setUpsellForAll('tshirt', 1))
    expect(readAssignments(result.current.selectedUpsells.tshirt.meta).every((entry) => Boolean(entry.size))).toBe(true)

    act(() => result.current.setUpsellForParticipant('tshirt', 'p2', 1, 'XL'))
    act(() => result.current.setUpsellSizeForAll('tshirt', 'S'))
    expect(readAssignments(result.current.selectedUpsells.tshirt.meta).map((entry) => entry.size)).toEqual(['S', 'S', 'S'])
  })

  it('drops the options of a participant who leaves the order', () => {
    const participants = people(2)
    const { result, rerender } = renderHook(
      ({ list }) => useUpsells(UPSELLS, list.map((p) => p.ticketId), list, 'eur'),
      { initialProps: { list: participants } },
    )
    act(() => result.current.setUpsellForAll('photos', 1))
    expect(result.current.selectedUpsells.photos.quantity).toBe(2)

    rerender({ list: participants.slice(0, 1) })
    expect(result.current.selectedUpsells.photos.quantity).toBe(1)
  })
})

describe('useUpsells: summary', () => {
  it('names the participants and never prints ids', () => {
    const { result } = setup(5)
    act(() => result.current.setUpsellForAll('photos', 1))

    const details = result.current.upsellSummaryItems.flatMap((item) => item.details).join(' | ')
    expect(details).toContain('Prenom1 Test')
    expect(details).toContain('et 2 autres')
    expect(details).not.toMatch(/p\d|ticket-1|assignments/i)
  })

  it('counts t-shirt sizes', () => {
    const { result } = setup(3)
    act(() => result.current.setUpsellForAll('tshirt', 1))
    act(() => result.current.setUpsellForParticipant('tshirt', 'p3', 1, 'XL'))

    const details = result.current.upsellSummaryItems.flatMap((item) => item.details).join(' | ')
    expect(details).toMatch(/Tailles : .*×2/)
    expect(details).toContain('XL')
  })
})
