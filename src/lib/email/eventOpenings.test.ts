import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, sendEventOpeningEmailMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  sendEventOpeningEmailMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/email', () => ({
  sendEventOpeningEmail: sendEventOpeningEmailMock,
}))

import { notifyEventOpening } from './eventOpenings'

interface FakeOptions {
  event?: { id: string; title: string; date: string; location: string; slug: string } | null
  eventError?: unknown
  notifications?: Array<{ id: string; email: string; full_name?: string | null; user_id?: string | null }>
  notificationsError?: unknown
}

function createFakeAdmin(options: FakeOptions) {
  const state = { updatedIds: [] as string[] }

  const admin = {
    from(table: string) {
      if (table === 'events') {
        return {
          select() {
            return {
              eq() {
                return {
                  single: async () => ({
                    data: options.event ?? null,
                    error: options.eventError ?? null,
                  }),
                }
              },
            }
          },
        }
      }

      if (table === 'event_opening_notifications') {
        return {
          select() {
            return {
              eq() {
                return {
                  is: async () => ({
                    data: options.notifications ?? [],
                    error: options.notificationsError ?? null,
                  }),
                }
              },
            }
          },
          update(_payload: Record<string, unknown>) {
            return {
              eq: async (_col: string, id: string) => {
                state.updatedIds.push(id)
                return { error: null }
              },
            }
          },
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    },
  }

  return { admin, state }
}

describe('notifyEventOpening', () => {
  const originalResendKey = process.env.RESEND_API_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-resend-key'
    sendEventOpeningEmailMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    process.env.RESEND_API_KEY = originalResendKey
  })

  it('sends an opening email to every unnotified recipient and marks them notified', async () => {
    const { admin, state } = createFakeAdmin({
      event: { id: 'event-1', title: 'Ultra Arena', date: '2026-09-12T08:00:00.000Z', location: 'Saint-Quentin-en-Yvelines', slug: 'ultra-arena' },
      notifications: [
        { id: 'notif-1', email: 'a@example.com', full_name: 'Alice' },
        { id: 'notif-2', email: 'b@example.com', full_name: null },
      ],
    })
    supabaseAdminMock.mockReturnValue(admin)

    await notifyEventOpening('event-1')

    expect(sendEventOpeningEmailMock).toHaveBeenCalledTimes(2)
    expect(sendEventOpeningEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'a@example.com', fullName: 'Alice', eventTitle: 'Ultra Arena' }),
    )
    expect(state.updatedIds.sort()).toEqual(['notif-1', 'notif-2'])
  })

  it('does nothing when RESEND_API_KEY is not configured', async () => {
    delete process.env.RESEND_API_KEY

    await notifyEventOpening('event-1')

    expect(supabaseAdminMock).not.toHaveBeenCalled()
    expect(sendEventOpeningEmailMock).not.toHaveBeenCalled()
  })

  it('does nothing when the event cannot be found', async () => {
    const { admin } = createFakeAdmin({ event: null, eventError: new Error('not found') })
    supabaseAdminMock.mockReturnValue(admin)

    await notifyEventOpening('missing-event')

    expect(sendEventOpeningEmailMock).not.toHaveBeenCalled()
  })

  it('does nothing when there are no pending notifications', async () => {
    const { admin } = createFakeAdmin({
      event: { id: 'event-1', title: 'Ultra Arena', date: '2026-09-12T08:00:00.000Z', location: 'SQY', slug: 'ultra-arena' },
      notifications: [],
    })
    supabaseAdminMock.mockReturnValue(admin)

    await notifyEventOpening('event-1')

    expect(sendEventOpeningEmailMock).not.toHaveBeenCalled()
  })

  it('does not mark a recipient as notified when the email send fails for them', async () => {
    const { admin, state } = createFakeAdmin({
      event: { id: 'event-1', title: 'Ultra Arena', date: '2026-09-12T08:00:00.000Z', location: 'SQY', slug: 'ultra-arena' },
      notifications: [{ id: 'notif-1', email: 'fail@example.com', full_name: null }],
    })
    supabaseAdminMock.mockReturnValue(admin)
    sendEventOpeningEmailMock.mockRejectedValueOnce(new Error('resend down'))

    await notifyEventOpening('event-1')

    expect(state.updatedIds).toEqual([])
  })
})
