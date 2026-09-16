import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, getLastEmailLogMock, recordEmailLogMock, sendAdminDigestEmailMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  getLastEmailLogMock: vi.fn(),
  recordEmailLogMock: vi.fn(),
  sendAdminDigestEmailMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/email/emailLogs', () => ({
  getLastEmailLog: getLastEmailLogMock,
  recordEmailLog: recordEmailLogMock,
}))

vi.mock('@/lib/email', () => ({
  sendAdminDigestEmail: sendAdminDigestEmailMock,
}))

import { sendAdminDigest } from './adminDigest'

interface FakeOptions {
  profiles?: Array<{ id: string; full_name: string | null; role: string }>
  profilesError?: unknown
  authUsers?: Array<{ id: string; email: string; user_metadata?: any }>
  logs?: Array<Record<string, unknown>>
  logsError?: unknown
}

function createFakeAdmin(options: FakeOptions) {
  return {
    from(table: string) {
      if (table === 'profiles') {
        return {
          select: () => ({
            in: async () => ({ data: options.profiles ?? null, error: options.profilesError ?? null }),
          }),
        }
      }
      if (table === 'admin_request_logs') {
        return {
          select: () => ({
            gte: () => ({
              order: () => ({
                limit: async () => ({ data: options.logs ?? [], error: options.logsError ?? null }),
              }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: options.authUsers ?? [] } }),
      },
    },
  }
}

describe('sendAdminDigest', () => {
  const originalResendKey = process.env.RESEND_API_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-resend-key'
    getLastEmailLogMock.mockResolvedValue(null)
    recordEmailLogMock.mockResolvedValue(undefined)
    sendAdminDigestEmailMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    process.env.RESEND_API_KEY = originalResendKey
  })

  it('sends the digest to every admin recipient with aggregated action/error counts', async () => {
    supabaseAdminMock.mockReturnValue(
      createFakeAdmin({
        profiles: [{ id: 'admin-1', full_name: 'Admin One', role: 'admin' }],
        authUsers: [{ id: 'admin-1', email: 'admin@example.com' }],
        logs: [
          { created_at: '2026-01-01T10:00:00.000Z', summary: 'ok', status_code: 200, user_email: 'x@example.com', action_type: 'update', path: '/api/x', duration_ms: 10 },
          { created_at: '2026-01-01T10:05:00.000Z', summary: 'fail', status_code: 500, user_email: 'y@example.com', action_type: 'update', path: '/api/y', duration_ms: 20 },
        ],
      }),
    )

    const count = await sendAdminDigest()

    expect(count).toBe(1)
    expect(sendAdminDigestEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'admin@example.com',
        totalActions: 2,
        totalErrors: 1,
      }),
    )
    expect(recordEmailLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'admin-1', emailType: 'admin_digest' }),
    )
  })

  it('returns 0 without querying anything when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY

    const count = await sendAdminDigest()

    expect(count).toBe(0)
    expect(supabaseAdminMock).not.toHaveBeenCalled()
  })

  it('returns 0 when there are no admin/super_admin profiles', async () => {
    supabaseAdminMock.mockReturnValue(createFakeAdmin({ profiles: [] }))

    const count = await sendAdminDigest()

    expect(count).toBe(0)
    expect(sendAdminDigestEmailMock).not.toHaveBeenCalled()
  })

  it('returns 0 and logs an error when the log fetch query fails', async () => {
    supabaseAdminMock.mockReturnValue(
      createFakeAdmin({
        profiles: [{ id: 'admin-1', full_name: 'Admin One', role: 'admin' }],
        authUsers: [{ id: 'admin-1', email: 'admin@example.com' }],
        logsError: new Error('db down'),
      }),
    )

    const count = await sendAdminDigest()

    expect(count).toBe(0)
    expect(sendAdminDigestEmailMock).not.toHaveBeenCalled()
  })

  it('skips an admin recipient with no resolvable auth email', async () => {
    supabaseAdminMock.mockReturnValue(
      createFakeAdmin({
        profiles: [{ id: 'admin-1', full_name: 'Admin One', role: 'admin' }],
        authUsers: [],
        logs: [],
      }),
    )

    const count = await sendAdminDigest()

    expect(count).toBe(0)
    expect(sendAdminDigestEmailMock).not.toHaveBeenCalled()
  })

  it('skips an admin recipient who already received a digest for this exact period', async () => {
    getLastEmailLogMock.mockResolvedValue({ id: 'log-1', sent_at: new Date().toISOString() })
    supabaseAdminMock.mockReturnValue(
      createFakeAdmin({
        profiles: [{ id: 'admin-1', full_name: 'Admin One', role: 'admin' }],
        authUsers: [{ id: 'admin-1', email: 'admin@example.com' }],
        logs: [],
      }),
    )

    await sendAdminDigest()

    expect(sendAdminDigestEmailMock).not.toHaveBeenCalled()
  })
})
