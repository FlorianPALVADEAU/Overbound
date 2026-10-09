import { describe, expect, it, vi } from 'vitest'
import { getActiveCampaignForEvent } from './campaign'

describe('getActiveCampaignForEvent', () => {
  it('orders by starts_at descending, so two active campaigns on the same event pick deterministically the most recently started one', async () => {
    const orderMock = vi.fn().mockReturnThis()
    const chain = {
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: orderMock,
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'newer', name: 'Newer', trigger_rules: {}, commercial_phase: 'STANDARD', reward_expiration_hours: 48 },
        error: null,
      }),
    }
    const admin = { from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue(chain) }) }

    const result = await getActiveCampaignForEvent({ admin, eventId: 'event-1' })

    expect(orderMock).toHaveBeenCalledWith('starts_at', { ascending: false })
    expect(result?.id).toBe('newer')
  })

  it('returns null when no campaign matches', async () => {
    const chain = {
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    const admin = { from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue(chain) }) }

    const result = await getActiveCampaignForEvent({ admin, eventId: 'event-1' })

    expect(result).toBeNull()
  })
})
