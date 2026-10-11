import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createDeletionRequest } from './deletionRequest'

const adminReturning = (error: { code?: string; message: string } | null) =>
  ({ from: () => ({ insert: async () => ({ error }) }) }) as unknown as SupabaseClient

const USER = { id: 'user-1', email: 'runner@example.com' }

describe('createDeletionRequest', () => {
  it('returns created when the insert succeeds', async () => {
    await expect(createDeletionRequest(adminReturning(null), USER)).resolves.toBe('created')
  })

  it('returns already_pending on the one-pending-per-user unique violation', async () => {
    await expect(
      createDeletionRequest(adminReturning({ code: '23505', message: 'duplicate' }), USER),
    ).resolves.toBe('already_pending')
  })

  it('throws on any other database error', async () => {
    await expect(createDeletionRequest(adminReturning({ code: '42501', message: 'denied' }), USER)).rejects.toThrow(
      'denied',
    )
  })
})
