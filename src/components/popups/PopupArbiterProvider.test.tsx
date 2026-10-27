import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { PopupArbiterProvider, useBlockingOverlay, usePopupSlot } from './PopupArbiterProvider'

describe('PopupArbiterProvider', () => {
  it('grants the slot to the first requester and rejects a different requester after', () => {
    const { result } = renderHook(() => usePopupSlot('lucky-wheel'), {
      wrapper: PopupArbiterProvider,
    })
    const requestSlot = result.current

    expect(requestSlot('lucky-wheel')).toBe(true)
    expect(requestSlot('marketing-popup')).toBe(false)
  })

  it('lets the same requester re-confirm it still holds the slot', () => {
    const { result } = renderHook(() => usePopupSlot('marketing-popup'), {
      wrapper: PopupArbiterProvider,
    })
    const requestSlot = result.current

    expect(requestSlot('marketing-popup')).toBe(true)
    expect(requestSlot('marketing-popup')).toBe(true)
  })

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => usePopupSlot('lucky-wheel'))).toThrow()
  })
})

describe('blocking overlay', () => {
  it('refuses every slot while an overlay is active, then grants it once released', () => {
    const { result, rerender } = renderHook(
      ({ blocked }: { blocked: boolean }) => {
        useBlockingOverlay(blocked)
        return usePopupSlot('lucky-wheel')
      },
      { wrapper: PopupArbiterProvider, initialProps: { blocked: true } },
    )
    expect(result.current('lucky-wheel')).toBe(false)

    rerender({ blocked: false })
    expect(result.current('lucky-wheel')).toBe(true)
  })
})
