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
