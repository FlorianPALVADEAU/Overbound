import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock } = vi.hoisted(() => ({ supabaseAdminMock: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))

import { filterSuppressed, recordSuppression } from './suppression'

describe('recordSuppression', () => {
  beforeEach(() => vi.clearAllMocks())

  it('upserts a lowercased address and unsubscribes it on complaint', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const ilike = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ ilike })
    supabaseAdminMock.mockReturnValue({
      from: (table: string) =>
        table === 'email_suppressions' ? { upsert } : { update },
    })

    const result = await recordSuppression({
      email: 'Runner@Example.com',
      reason: 'complaint',
      eventId: 'sns-1',
    })

    expect(result).toEqual({ ok: true })
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'runner@example.com', reason: 'complaint', event_id: 'sns-1' }),
      { onConflict: 'email', ignoreDuplicates: true },
    )
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ subscribed: false }))
    expect(ilike).toHaveBeenCalledWith('email', 'runner@example.com')
  })

  it('does not touch subscriptions on a bounce', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn().mockReturnValue({ upsert })
    supabaseAdminMock.mockReturnValue({ from })

    await recordSuppression({ email: 'a@b.fr', reason: 'bounce', eventId: 'sns-2' })

    expect(from).toHaveBeenCalledTimes(1)
    expect(from).toHaveBeenCalledWith('email_suppressions')
  })

  it('returns an error when the upsert fails so the webhook can ask SNS to retry', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: 'db down' } })
    supabaseAdminMock.mockReturnValue({ from: () => ({ upsert }) })

    const result = await recordSuppression({ email: 'a@b.fr', reason: 'bounce', eventId: 'sns-3' })

    expect(result).toEqual({ ok: false, message: 'db down' })
  })
})

describe('filterSuppressed', () => {
  beforeEach(() => vi.clearAllMocks())

  it('removes suppressed addresses, case-insensitively', async () => {
    const inMock = vi.fn().mockResolvedValue({ data: [{ email: 'bad@x.fr' }], error: null })
    supabaseAdminMock.mockReturnValue({
      from: () => ({ select: () => ({ in: inMock }) }),
    })

    const kept = await filterSuppressed([
      { email: 'Bad@X.fr' },
      { email: 'good@x.fr' },
    ])

    expect(kept).toEqual([{ email: 'good@x.fr' }])
  })

  it('throws when the suppression list cannot be read, instead of sending to everyone', async () => {
    supabaseAdminMock.mockReturnValue({
      from: () => ({
        select: () => ({ in: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }) }),
      }),
    })

    await expect(filterSuppressed([{ email: 'a@b.fr' }])).rejects.toThrow('boom')
  })

  it('returns an empty list without a query for empty input', async () => {
    expect(await filterSuppressed([])).toEqual([])
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })
})
