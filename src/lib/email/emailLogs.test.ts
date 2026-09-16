import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { recordEmailLog, getLastEmailLog } from './emailLogs'

describe('emailLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('recordEmailLog', () => {
    it('inserts a row with the provided fields and defaults context to null', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null })
      supabaseAdminMock.mockReturnValue({
        from: (table: string) => {
          expect(table).toBe('email_logs')
          return { insert: insertMock }
        },
      })

      await recordEmailLog({
        userId: 'user-1',
        email: 'user@example.com',
        emailType: 'onboarding',
      })

      expect(insertMock).toHaveBeenCalledWith({
        user_id: 'user-1',
        email: 'user@example.com',
        email_type: 'onboarding',
        context: null,
      })
    })

    it('propagates a Supabase insert failure instead of swallowing it', async () => {
      const insertMock = vi.fn().mockRejectedValue(new Error('insert failed'))
      supabaseAdminMock.mockReturnValue({
        from: () => ({ insert: insertMock }),
      })

      await expect(
        recordEmailLog({ userId: 'user-1', email: 'user@example.com', emailType: 'onboarding' }),
      ).rejects.toThrow('insert failed')
    })
  })

  describe('getLastEmailLog', () => {
    it('returns the most recent log row without extra context filters', async () => {
      const limitMock = vi.fn().mockResolvedValue({
        data: [{ id: 'log-1', user_id: 'user-1', email: 'user@example.com', email_type: 'onboarding', context: null, sent_at: '2026-01-01T00:00:00.000Z' }],
        error: null,
      })
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock })
      const eqEmailType = vi.fn().mockReturnValue({ order: orderMock })
      const eqUserId = vi.fn().mockReturnValue({ eq: eqEmailType })
      const selectMock = vi.fn().mockReturnValue({ eq: eqUserId })

      supabaseAdminMock.mockReturnValue({
        from: () => ({ select: selectMock }),
      })

      const result = await getLastEmailLog({ userId: 'user-1', emailType: 'onboarding' })

      expect(result).toEqual(
        expect.objectContaining({ id: 'log-1', user_id: 'user-1', email_type: 'onboarding' }),
      )
      expect(limitMock).toHaveBeenCalledWith(1)
    })

    it('returns null when the query errors out', async () => {
      const limitMock = vi.fn().mockResolvedValue({ data: null, error: new Error('db error') })
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock })
      const eqEmailType = vi.fn().mockReturnValue({ order: orderMock })
      const eqUserId = vi.fn().mockReturnValue({ eq: eqEmailType })
      const selectMock = vi.fn().mockReturnValue({ eq: eqUserId })

      supabaseAdminMock.mockReturnValue({
        from: () => ({ select: selectMock }),
      })

      const result = await getLastEmailLog({ userId: 'user-1', emailType: 'onboarding' })

      expect(result).toBeNull()
    })

    it('returns null when no log row exists yet', async () => {
      const limitMock = vi.fn().mockResolvedValue({ data: [], error: null })
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock })
      const eqEmailType = vi.fn().mockReturnValue({ order: orderMock })
      const eqUserId = vi.fn().mockReturnValue({ eq: eqEmailType })
      const selectMock = vi.fn().mockReturnValue({ eq: eqUserId })

      supabaseAdminMock.mockReturnValue({
        from: () => ({ select: selectMock }),
      })

      const result = await getLastEmailLog({ userId: 'user-1', emailType: 'onboarding' })

      expect(result).toBeNull()
    })

    it('applies contextFilters via .contains() when provided', async () => {
      const containsMock = vi.fn().mockResolvedValue({ data: [], error: null })
      // The query-builder result of .limit() is itself awaitable AND chainable with .contains()
      const limitResult: any = Promise.resolve({ data: [], error: null })
      limitResult.contains = containsMock
      const limitMock = vi.fn().mockReturnValue(limitResult)
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock })
      const eqEmailType = vi.fn().mockReturnValue({ order: orderMock })
      const eqUserId = vi.fn().mockReturnValue({ eq: eqEmailType })
      const selectMock = vi.fn().mockReturnValue({ eq: eqUserId })

      supabaseAdminMock.mockReturnValue({
        from: () => ({ select: selectMock }),
      })

      await getLastEmailLog({
        userId: 'user-1',
        emailType: 'event_updated',
        contextFilters: { event_id: 'event-1' },
      })

      expect(containsMock).toHaveBeenCalledWith('context', { event_id: 'event-1' })
      expect(limitMock).toHaveBeenCalledWith(1)
    })
  })
})
