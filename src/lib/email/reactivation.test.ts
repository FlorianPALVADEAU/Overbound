import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  sendInactiveUserEmailMock,
  sendAbandonedCheckoutEmailMock,
  getLastEmailLogMock,
  recordEmailLogMock,
  supabaseAdminMock,
  getMarketingOptInRecipientsMock,
} = vi.hoisted(() => ({
  sendInactiveUserEmailMock: vi.fn(),
  sendAbandonedCheckoutEmailMock: vi.fn(),
  getLastEmailLogMock: vi.fn(),
  recordEmailLogMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  getMarketingOptInRecipientsMock: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendInactiveUserEmail: sendInactiveUserEmailMock,
  sendAbandonedCheckoutEmail: sendAbandonedCheckoutEmailMock,
}))

vi.mock('@/lib/email/emailLogs', () => ({
  getLastEmailLog: getLastEmailLogMock,
  recordEmailLog: recordEmailLogMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/email/marketing', () => ({
  getMarketingOptInRecipients: getMarketingOptInRecipientsMock,
}))

import { sendInactiveUserWinback, sendAbandonedCheckoutReminders } from './reactivation'

describe('sendInactiveUserWinback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getLastEmailLogMock.mockResolvedValue(null)
    recordEmailLogMock.mockResolvedValue(undefined)
    sendInactiveUserEmailMock.mockResolvedValue(undefined)
  })

  function createAdmin(registrations: Array<{ user_id: string; created_at: string; event?: any }>) {
    return {
      from(table: string) {
        if (table === 'registrations') {
          return {
            select: () => ({
              in: () => ({
                order: async () => ({ data: registrations, error: null }),
              }),
            }),
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    }
  }

  it('sends a winback email to a recruit with no recent registration', async () => {
    getMarketingOptInRecipientsMock.mockResolvedValue([
      { userId: 'user-1', email: 'inactive@example.com', fullName: 'Alice' },
    ])
    supabaseAdminMock.mockReturnValue(createAdmin([]))

    const sent = await sendInactiveUserWinback()

    expect(sent).toBe(1)
    expect(sendInactiveUserEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'inactive@example.com', userId: 'user-1' }),
    )
    expect(recordEmailLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', emailType: 'reactivation_inactive' }),
    )
  })

  it('skips a recipient whose last registration is within the 90-day window', async () => {
    getMarketingOptInRecipientsMock.mockResolvedValue([
      { userId: 'user-1', email: 'recent@example.com', fullName: 'Bob' },
    ])
    supabaseAdminMock.mockReturnValue(
      createAdmin([{ user_id: 'user-1', created_at: new Date().toISOString() }]),
    )

    const sent = await sendInactiveUserWinback()

    expect(sent).toBe(0)
    expect(sendInactiveUserEmailMock).not.toHaveBeenCalled()
  })

  it('returns 0 and does not throw when the marketing recipient lookup fails', async () => {
    getMarketingOptInRecipientsMock.mockRejectedValue(new Error('boom'))

    const sent = await sendInactiveUserWinback()

    expect(sent).toBe(0)
    expect(sendInactiveUserEmailMock).not.toHaveBeenCalled()
  })

  it('returns 0 immediately when there are no opted-in recipients', async () => {
    getMarketingOptInRecipientsMock.mockResolvedValue([])
    supabaseAdminMock.mockReturnValue(createAdmin([]))

    const sent = await sendInactiveUserWinback()

    expect(sent).toBe(0)
    expect(sendInactiveUserEmailMock).not.toHaveBeenCalled()
  })
})

describe('sendAbandonedCheckoutReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getLastEmailLogMock.mockResolvedValue(null)
    recordEmailLogMock.mockResolvedValue(undefined)
    sendAbandonedCheckoutEmailMock.mockResolvedValue(undefined)
  })

  function createAdmin(options: {
    orders: Array<{ id: string; user_id: string; email: string | null; created_at: string; amount_total: number | null; currency: string | null }>
    ordersError?: unknown
    registrations?: Array<{ order_id: string; event?: any; ticket?: any }>
    authUsers?: Array<{ id: string; email: string; user_metadata?: any }>
  }) {
    return {
      from(table: string) {
        if (table === 'orders') {
          return {
            select: () => ({
              eq: () => ({
                lt: async () => ({ data: options.orders, error: options.ordersError ?? null }),
              }),
            }),
          }
        }
        if (table === 'registrations') {
          return {
            select: () => ({
              in: async () => ({ data: options.registrations ?? [], error: null }),
            }),
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
      auth: {
        admin: {
          listUsers: async () => ({
            data: { users: options.authUsers ?? [] },
          }),
        },
      },
    }
  }

  it('sends an abandoned checkout reminder for a pending order older than 2 days', async () => {
    supabaseAdminMock.mockReturnValue(
      createAdmin({
        orders: [
          {
            id: 'order-1',
            user_id: 'user-1',
            email: 'checkout@example.com',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            amount_total: 4900,
            currency: 'eur',
          },
        ],
        registrations: [{ order_id: 'order-1', event: { title: 'Ultra Arena', slug: 'ultra-arena' }, ticket: { name: 'OPEN' } }],
        authUsers: [{ id: 'user-1', email: 'checkout@example.com', user_metadata: { full_name: 'Claire' } }],
      }),
    )

    const sent = await sendAbandonedCheckoutReminders()

    expect(sent).toBe(1)
    expect(sendAbandonedCheckoutEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'checkout@example.com',
        fullName: 'Claire',
        eventTitle: 'Ultra Arena',
        ticketName: 'OPEN',
      }),
    )
    expect(recordEmailLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', emailType: 'reactivation_abandoned_checkout' }),
    )
  })

  it('returns 0 and logs an error when the pending orders query fails', async () => {
    supabaseAdminMock.mockReturnValue(
      createAdmin({ orders: [], ordersError: new Error('db down') }),
    )

    const sent = await sendAbandonedCheckoutReminders()

    expect(sent).toBe(0)
    expect(sendAbandonedCheckoutEmailMock).not.toHaveBeenCalled()
  })

  it('filters out orders missing an email or user_id before sending', async () => {
    supabaseAdminMock.mockReturnValue(
      createAdmin({
        orders: [
          { id: 'order-1', user_id: 'user-1', email: null, created_at: new Date().toISOString(), amount_total: null, currency: null },
        ],
      }),
    )

    const sent = await sendAbandonedCheckoutReminders()

    expect(sent).toBe(0)
    expect(sendAbandonedCheckoutEmailMock).not.toHaveBeenCalled()
  })

  it('skips an order that was already reminded for the same order_id', async () => {
    getLastEmailLogMock.mockResolvedValue({ id: 'log-1', sent_at: new Date().toISOString() })
    supabaseAdminMock.mockReturnValue(
      createAdmin({
        orders: [
          {
            id: 'order-1',
            user_id: 'user-1',
            email: 'checkout@example.com',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            amount_total: 4900,
            currency: 'eur',
          },
        ],
      }),
    )

    const sent = await sendAbandonedCheckoutReminders()

    expect(sent).toBe(0)
    expect(sendAbandonedCheckoutEmailMock).not.toHaveBeenCalled()
  })
})
