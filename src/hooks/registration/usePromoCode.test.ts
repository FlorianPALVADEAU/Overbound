import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePromoCode } from './usePromoCode'

const ambassadorPromo = { code: 'OVERBOUND-FLO', is_ambassador: true }

const withUrl = (search: string) => {
  Object.defineProperty(window, 'location', { value: { ...window.location, search }, writable: true })
}

describe('usePromoCode referral', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('applies the ?ref= code of the current URL even when nothing captured it before (in-app navigation)', async () => {
    withUrl('?ref=overbound-flo')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ promotionalCode: ambassadorPromo }), { status: 200 }),
    )

    const { result } = renderHook(() => usePromoCode('event-1'))

    await waitFor(() => expect(result.current.appliedPromos).toHaveLength(1))
    expect(result.current.ambassadorReferralCode).toBe('OVERBOUND-FLO')
  })

  it('leaves the field empty when the URL has no ref and nothing is stored', async () => {
    withUrl('')
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { result } = renderHook(() => usePromoCode('event-1'))

    expect(result.current.appliedPromos).toHaveLength(0)
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
