import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  sendOnboardingEmailMock,
  sendProfileCompletionReminderEmailMock,
  getLastEmailLogMock,
  recordEmailLogMock,
} = vi.hoisted(() => ({
  sendOnboardingEmailMock: vi.fn(),
  sendProfileCompletionReminderEmailMock: vi.fn(),
  getLastEmailLogMock: vi.fn(),
  recordEmailLogMock: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendOnboardingEmail: sendOnboardingEmailMock,
  sendProfileCompletionReminderEmail: sendProfileCompletionReminderEmailMock,
}))

vi.mock('@/lib/email/emailLogs', () => ({
  getLastEmailLog: getLastEmailLogMock,
  recordEmailLog: recordEmailLogMock,
}))

import { processAccountEngagementEmails } from './engagement'

describe('processAccountEngagementEmails', () => {
  const originalResendKey = process.env.RESEND_API_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-resend-key'
    getLastEmailLogMock.mockResolvedValue(null)
    recordEmailLogMock.mockResolvedValue(undefined)
    sendOnboardingEmailMock.mockResolvedValue(undefined)
    sendProfileCompletionReminderEmailMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    process.env.RESEND_API_KEY = originalResendKey
  })

  it('does nothing at all when RESEND_API_KEY is not configured', async () => {
    delete process.env.RESEND_API_KEY

    await processAccountEngagementEmails({
      userId: 'user-1',
      email: 'user@example.com',
    })

    expect(sendOnboardingEmailMock).not.toHaveBeenCalled()
    expect(sendProfileCompletionReminderEmailMock).not.toHaveBeenCalled()
  })

  it('sends the onboarding email and logs it when none was sent before', async () => {
    await processAccountEngagementEmails({
      userId: 'user-1',
      email: 'user@example.com',
      fullName: 'Alice Martin',
    })

    expect(sendOnboardingEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@example.com', fullName: 'Alice Martin' }),
    )
    expect(recordEmailLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', email: 'user@example.com', emailType: 'onboarding' }),
    )
  })

  it('skips the onboarding email when one was already logged', async () => {
    getLastEmailLogMock.mockImplementation(async ({ emailType }: { emailType: string }) => {
      if (emailType === 'onboarding') {
        return { id: 'log-1', sent_at: new Date().toISOString() }
      }
      return null
    })

    await processAccountEngagementEmails({
      userId: 'user-1',
      email: 'user@example.com',
    })

    expect(sendOnboardingEmailMock).not.toHaveBeenCalled()
  })

  it('sends the profile completion reminder when fields are missing and no reminder was sent recently', async () => {
    await processAccountEngagementEmails({
      userId: 'user-1',
      email: 'user@example.com',
      profile: { full_name: null, phone: '0600000000', date_of_birth: null },
    })

    expect(sendProfileCompletionReminderEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        missingFields: ['Nom complet', 'Date de naissance'],
      }),
    )
    expect(recordEmailLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ emailType: 'profile_nudge', context: { missing_fields: ['Nom complet', 'Date de naissance'] } }),
    )
  })

  it('does not send the profile reminder when every field is already completed', async () => {
    await processAccountEngagementEmails({
      userId: 'user-1',
      email: 'user@example.com',
      profile: { full_name: 'Alice', phone: '0600000000', date_of_birth: '1990-01-01' },
    })

    expect(sendProfileCompletionReminderEmailMock).not.toHaveBeenCalled()
  })

  it('does not send the profile reminder again within the cooldown window', async () => {
    getLastEmailLogMock.mockImplementation(async ({ emailType }: { emailType: string }) => {
      if (emailType === 'profile_nudge') {
        return { id: 'log-2', sent_at: new Date().toISOString() }
      }
      return null
    })

    await processAccountEngagementEmails({
      userId: 'user-1',
      email: 'user@example.com',
      profile: { full_name: null, phone: null, date_of_birth: null },
    })

    expect(sendProfileCompletionReminderEmailMock).not.toHaveBeenCalled()
  })

  it('swallows an error thrown by the onboarding email send and still attempts the profile reminder', async () => {
    sendOnboardingEmailMock.mockRejectedValueOnce(new Error('resend failure'))

    await expect(
      processAccountEngagementEmails({
        userId: 'user-1',
        email: 'user@example.com',
        profile: { full_name: null, phone: null, date_of_birth: null },
      }),
    ).resolves.toBeUndefined()

    expect(sendProfileCompletionReminderEmailMock).toHaveBeenCalled()
  })
})
