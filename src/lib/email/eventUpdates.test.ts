import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, getLastEmailLogMock, recordEmailLogMock, sendEventUpdateEmailMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  getLastEmailLogMock: vi.fn(),
  recordEmailLogMock: vi.fn(),
  sendEventUpdateEmailMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/email/emailLogs', () => ({
  getLastEmailLog: getLastEmailLogMock,
  recordEmailLog: recordEmailLogMock,
}))

vi.mock('@/lib/email', () => ({
  sendEventUpdateEmail: sendEventUpdateEmailMock,
}))

import { notifyEventUpdate } from './eventUpdates'

interface Registration {
  id: string
  user_id: string | null
  email: string | null
}

function createFakeAdmin(registrations: Registration[], profiles: Array<{ id: string; full_name: string | null }> = []) {
  const admin = {
    from(table: string) {
      if (table === 'registrations') {
        return {
          select() {
            return {
              eq: async () => ({ data: registrations, error: null }),
            }
          },
        }
      }

      if (table === 'profiles') {
        return {
          select() {
            return {
              in: async () => ({ data: profiles, error: null }),
            }
          },
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    },
  }

  return admin
}

describe('notifyEventUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getLastEmailLogMock.mockResolvedValue(null)
    recordEmailLogMock.mockResolvedValue(undefined)
    sendEventUpdateEmailMock.mockResolvedValue(undefined)
  })

  it('notifies every registered participant when the event date changes', async () => {
    const admin = createFakeAdmin([
      { id: 'reg-1', user_id: 'user-1', email: 'a@example.com' },
      { id: 'reg-2', user_id: 'user-2', email: 'b@example.com' },
    ], [{ id: 'user-1', full_name: 'Alice' }, { id: 'user-2', full_name: 'Bob' }])
    supabaseAdminMock.mockReturnValue(admin)

    await notifyEventUpdate({
      previous: { id: 'event-1', title: 'Ultra Arena', date: '2026-09-12T08:00:00.000Z', location: 'SQY' },
      current: { id: 'event-1', title: 'Ultra Arena', date: '2026-09-13T08:00:00.000Z', location: 'SQY' },
    })

    expect(sendEventUpdateEmailMock).toHaveBeenCalledTimes(2)
    expect(recordEmailLogMock).toHaveBeenCalledTimes(2)
    expect(sendEventUpdateEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'a@example.com', participantName: 'Alice', eventTitle: 'Ultra Arena' }),
    )
  })

  it('does nothing when neither date nor location changed', async () => {
    const admin = createFakeAdmin([{ id: 'reg-1', user_id: 'user-1', email: 'a@example.com' }])
    supabaseAdminMock.mockReturnValue(admin)

    await notifyEventUpdate({
      previous: { id: 'event-1', title: 'Ultra Arena', date: '2026-09-12T08:00:00.000Z', location: 'SQY' },
      current: { id: 'event-1', title: 'Ultra Arena', date: '2026-09-12T08:00:00.000Z', location: 'SQY' },
    })

    expect(supabaseAdminMock).not.toHaveBeenCalled()
    expect(sendEventUpdateEmailMock).not.toHaveBeenCalled()
  })

  it('treats a null previous snapshot as always requiring notification', async () => {
    const admin = createFakeAdmin([{ id: 'reg-1', user_id: 'user-1', email: 'a@example.com' }])
    supabaseAdminMock.mockReturnValue(admin)

    await notifyEventUpdate({
      previous: null,
      current: { id: 'event-1', title: 'Ultra Arena', date: '2026-09-12T08:00:00.000Z', location: 'SQY' },
    })

    expect(sendEventUpdateEmailMock).toHaveBeenCalledTimes(1)
  })

  it('skips registrations that were already notified for this event/registration pair', async () => {
    const admin = createFakeAdmin([{ id: 'reg-1', user_id: 'user-1', email: 'a@example.com' }])
    supabaseAdminMock.mockReturnValue(admin)
    getLastEmailLogMock.mockResolvedValue({ id: 'log-1', sent_at: new Date().toISOString() })

    await notifyEventUpdate({
      previous: { id: 'event-1', title: 'Ultra Arena', date: '2026-09-12T08:00:00.000Z', location: 'SQY' },
      current: { id: 'event-1', title: 'Ultra Arena', date: '2026-09-13T08:00:00.000Z', location: 'SQY' },
    })

    expect(sendEventUpdateEmailMock).not.toHaveBeenCalled()
  })

  it('skips registrations without an email address', async () => {
    const admin = createFakeAdmin([{ id: 'reg-1', user_id: 'user-1', email: null }])
    supabaseAdminMock.mockReturnValue(admin)

    await notifyEventUpdate({
      previous: { id: 'event-1', title: 'Ultra Arena', date: '2026-09-12T08:00:00.000Z', location: 'SQY' },
      current: { id: 'event-1', title: 'Ultra Arena', date: '2026-09-13T08:00:00.000Z', location: 'SQY' },
    })

    expect(sendEventUpdateEmailMock).not.toHaveBeenCalled()
  })

  it('does nothing when there are no registrations for the event', async () => {
    const admin = createFakeAdmin([])
    supabaseAdminMock.mockReturnValue(admin)

    await notifyEventUpdate({
      previous: { id: 'event-1', title: 'Ultra Arena', date: '2026-09-12T08:00:00.000Z', location: 'SQY' },
      current: { id: 'event-1', title: 'Ultra Arena', date: '2026-09-13T08:00:00.000Z', location: 'SQY' },
    })

    expect(sendEventUpdateEmailMock).not.toHaveBeenCalled()
  })
})
