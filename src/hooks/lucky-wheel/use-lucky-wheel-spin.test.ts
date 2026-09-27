import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useLuckyWheelSpin } from './use-lucky-wheel-spin'

const EVENT_ID = 'event-1'

function mockFetchJson(body: unknown, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({ ok, json: async () => body }) as unknown as typeof fetch
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('useLuckyWheelSpin', () => {
  it('exposes the minted promo code in the outcome for a discount-type win', async () => {
    mockFetchJson({
      success: true,
      allocation_id: 'alloc-1',
      reward_id: 'reward-1',
      reward_name: 'Réduction Lucky Wheel',
      reward_type: 'TICKET_PERCENT_DISCOUNT',
      promo_code: 'LWHEEL-ABC123',
      won_at: '2026-09-20T10:00:00Z',
      expires_at: '2026-09-22T10:00:00Z',
    })

    const { result } = renderHook(() => useLuckyWheelSpin(EVENT_ID))

    await act(async () => {
      await result.current.spin('entry-1')
    })

    expect(result.current.outcome).toEqual(
      expect.objectContaining({ allocationId: 'alloc-1', promoCode: 'LWHEEL-ABC123' }),
    )
  })

  it('has a null promo code for a non-discount win (e.g. free product)', async () => {
    mockFetchJson({
      success: true,
      allocation_id: 'alloc-2',
      reward_id: 'reward-2',
      reward_name: 'Patch Overbound offert',
      reward_type: 'FREE_PRODUCT',
      promo_code: null,
      won_at: '2026-09-20T10:00:00Z',
      expires_at: '2026-09-22T10:00:00Z',
    })

    const { result } = renderHook(() => useLuckyWheelSpin(EVENT_ID))

    await act(async () => {
      await result.current.spin('entry-1')
    })

    expect(result.current.outcome).toEqual(
      expect.objectContaining({ allocationId: 'alloc-2', promoCode: null }),
    )
  })

  it('marks local participation on a no-reward outcome (blocks a reroll on refresh)', async () => {
    mockFetchJson({ success: false, error: 'NO_REWARD_AVAILABLE' })

    const { result } = renderHook(() => useLuckyWheelSpin(EVENT_ID))

    await act(async () => {
      await result.current.spin('entry-1')
    })

    expect(result.current.hasLocalParticipationFlag()).toBe(true)
  })

  it('marks local participation on submitEmail already_participated response', async () => {
    mockFetchJson({ wheel_entry_id: 'entry-1', already_participated: true })

    const { result } = renderHook(() => useLuckyWheelSpin(EVENT_ID))

    await act(async () => {
      await result.current.submitEmail({ email: 'runner@example.com', marketingConsent: false })
    })

    await waitFor(() => expect(result.current.hasLocalParticipationFlag()).toBe(true))
  })

  it('surfaces an error and rejects when the spin request fails', async () => {
    mockFetchJson({ error: 'CAMPAIGN_UNAVAILABLE' }, false)

    const { result } = renderHook(() => useLuckyWheelSpin(EVENT_ID))

    const caught: { error: Error | null } = { error: null }
    await act(async () => {
      try {
        await result.current.spin('entry-1')
      } catch (err) {
        caught.error = err as Error
      }
    })

    expect(caught.error?.message).toBe('CAMPAIGN_UNAVAILABLE')
    expect(result.current.error).toBe('CAMPAIGN_UNAVAILABLE')
  })
})
