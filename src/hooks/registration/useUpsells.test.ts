import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { EventUpsell } from '@/components/registration/types'
import { useUpsells } from './useUpsells'

const upsell = (id: string, type: EventUpsell['type']): EventUpsell =>
  ({ id, name: id, type, price_cents: 1000, currency: 'eur', is_active: true, options: null }) as unknown as EventUpsell

const UPSELLS = [upsell('photos', 'photos'), upsell('tshirt', 'tshirt'), upsell('patch', 'patch')]
const SLOTS = ['ticket-1']

describe('useUpsells: deselecting an option', () => {
  it.each(['photos', 'tshirt', 'patch'])('removes %s from the cart when its quantity goes back to 0', (id) => {
    const { result } = renderHook(() => useUpsells(UPSELLS, SLOTS, [], 'eur'))

    act(() => result.current.handleUpsellChange(id, 1))
    expect(result.current.selectedUpsells[id]?.quantity).toBe(1)

    act(() => result.current.handleUpsellChange(id, 0))
    // A zero-quantity entry would be posted to the API, which rejects it
    // ("La quantité d'une option doit être un entier positif.").
    expect(result.current.selectedUpsells[id]).toBeUndefined()
    expect(Object.values(result.current.selectedUpsells).every((entry) => entry.quantity > 0)).toBe(true)
  })

  it('keeps the other selected options untouched', () => {
    const { result } = renderHook(() => useUpsells(UPSELLS, SLOTS, [], 'eur'))

    act(() => result.current.handleUpsellChange('photos', 1))
    act(() => result.current.handleUpsellChange('patch', 2))
    act(() => result.current.handleUpsellChange('photos', 0))

    expect(Object.keys(result.current.selectedUpsells)).toEqual(['patch'])
    expect(result.current.selectedUpsells.patch.quantity).toBe(2)
  })
})

describe('useUpsells: photo packs per participant', () => {
  const participants = [
    { id: 'p1', ticketId: 'ticket-1', firstName: 'Camille', lastName: 'Martin' },
    { id: 'p2', ticketId: 'ticket-1', firstName: 'Sam', lastName: 'Durand' },
  ] as never
  const slots = ['ticket-1', 'ticket-1']

  it('keeps quantity equal to the number of ticked participants', () => {
    const { result } = renderHook(() => useUpsells(UPSELLS, slots, participants, 'eur'))

    act(() => result.current.handlePhotoPackToggle('photos', 'ticket-1', true))
    act(() => result.current.handlePhotoPackToggle('photos', 'ticket-1', true))
    expect(result.current.selectedUpsells.photos.quantity).toBe(2)

    act(() => result.current.handlePhotoPackToggle('photos', 'ticket-1', false))
    expect(result.current.selectedUpsells.photos.quantity).toBe(1)

    act(() => result.current.handlePhotoPackToggle('photos', 'ticket-1', false))
    expect(result.current.selectedUpsells.photos).toBeUndefined()
  })

  it('never offers more packs than tickets', () => {
    const { result } = renderHook(() => useUpsells(UPSELLS, ['ticket-1'], participants, 'eur'))
    act(() => result.current.handlePhotoPackToggle('photos', 'ticket-1', true))
    act(() => result.current.handlePhotoPackToggle('photos', 'ticket-1', true))
    expect(result.current.selectedUpsells.photos.quantity).toBe(1)
  })

  it('summarises a photo pack with names, never with ticket ids', () => {
    const { result } = renderHook(() => useUpsells(UPSELLS, slots, participants, 'eur'))
    act(() => result.current.handlePhotoPackToggle('photos', 'ticket-1', true))

    const details = result.current.upsellSummaryItems.flatMap((item) => item.details).join(' | ')
    expect(details).toContain('Camille Martin')
    expect(details).not.toMatch(/ticket-1|assignments/i)
  })
})
