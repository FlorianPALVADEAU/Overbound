import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  sendNewEventAnnouncementEmailMock,
  sendPriceChangeReminderEmailMock,
  sendPromoCampaignEmailMock,
  getLastEmailLogMock,
  recordEmailLogMock,
  supabaseAdminMock,
  getListRecipientsMock,
  getMultipleListsRecipientsMock,
} = vi.hoisted(() => ({
  sendNewEventAnnouncementEmailMock: vi.fn(),
  sendPriceChangeReminderEmailMock: vi.fn(),
  sendPromoCampaignEmailMock: vi.fn(),
  getLastEmailLogMock: vi.fn(),
  recordEmailLogMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  getListRecipientsMock: vi.fn(),
  getMultipleListsRecipientsMock: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendNewEventAnnouncementEmail: sendNewEventAnnouncementEmailMock,
  sendPriceChangeReminderEmail: sendPriceChangeReminderEmailMock,
  sendPromoCampaignEmail: sendPromoCampaignEmailMock,
}))

vi.mock('@/lib/email/emailLogs', () => ({
  getLastEmailLog: getLastEmailLogMock,
  recordEmailLog: recordEmailLogMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/subscriptions/lists', () => ({
  getListRecipients: getListRecipientsMock,
  getMultipleListsRecipients: getMultipleListsRecipientsMock,
}))

import {
  dispatchNewEventAnnouncement,
  dispatchPriceChangeReminder,
  dispatchPromoCampaign,
  sendMarketingEmail,
  getRecipientsFromList,
  getRecipientsFromLists,
  getEventAnnouncementRecipients,
  getPriceAlertRecipients,
  getMarketingOptInRecipients,
} from './marketing'

const noPreferencesAdmin = () => ({
  from: () => ({
    select: () => ({
      in: async () => ({ data: [], error: null }),
    }),
  }),
})

describe('email/marketing', () => {
  const originalResendKey = process.env.RESEND_API_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-resend-key'
    getLastEmailLogMock.mockResolvedValue(null)
    recordEmailLogMock.mockResolvedValue(undefined)
    supabaseAdminMock.mockReturnValue(noPreferencesAdmin())
    sendNewEventAnnouncementEmailMock.mockResolvedValue(undefined)
    sendPriceChangeReminderEmailMock.mockResolvedValue(undefined)
    sendPromoCampaignEmailMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    process.env.RESEND_API_KEY = originalResendKey
  })

  describe('dispatchNewEventAnnouncement', () => {
    it('sends the announcement to every recipient and logs it', async () => {
      await dispatchNewEventAnnouncement({
        recipients: [{ userId: 'u1', email: 'a@example.com', fullName: 'Alice' }],
        eventTitle: 'Ultra Arena',
        eventDate: '12 septembre 2026',
        eventLocation: 'SQY',
        eventUrl: 'https://overbound-race.com/events/ultra-arena',
      })

      expect(sendNewEventAnnouncementEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'a@example.com', eventTitle: 'Ultra Arena' }),
      )
      expect(recordEmailLogMock).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1', emailType: 'marketing_new_event' }),
      )
    })

    it('does nothing when RESEND_API_KEY is not configured', async () => {
      delete process.env.RESEND_API_KEY

      await dispatchNewEventAnnouncement({
        recipients: [{ userId: 'u1', email: 'a@example.com' }],
        eventTitle: 'Ultra Arena',
        eventDate: '12 septembre 2026',
        eventLocation: 'SQY',
        eventUrl: 'https://overbound-race.com/events/ultra-arena',
      })

      expect(sendNewEventAnnouncementEmailMock).not.toHaveBeenCalled()
    })
  })

  describe('dispatchPriceChangeReminder', () => {
    it('sends the price change reminder to every recipient', async () => {
      await dispatchPriceChangeReminder({
        recipients: [{ userId: 'u1', email: 'a@example.com' }],
        eventTitle: 'Ultra Arena',
        eventDate: '12 septembre 2026',
        deadlineLabel: '31 mars',
        eventUrl: 'https://overbound-race.com/events/ultra-arena',
        currentPriceLabel: '49€',
      })

      expect(sendPriceChangeReminderEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'a@example.com', deadlineLabel: '31 mars' }),
      )
    })

    it('does not resend when a log already exists for this event/deadline context', async () => {
      getLastEmailLogMock.mockResolvedValue({ id: 'log-1', sent_at: new Date().toISOString() })

      await dispatchPriceChangeReminder({
        recipients: [{ userId: 'u1', email: 'a@example.com' }],
        eventTitle: 'Ultra Arena',
        eventDate: '12 septembre 2026',
        deadlineLabel: '31 mars',
        eventUrl: 'https://overbound-race.com/events/ultra-arena',
        currentPriceLabel: '49€',
      })

      expect(sendPriceChangeReminderEmailMock).not.toHaveBeenCalled()
    })
  })

  describe('dispatchPromoCampaign', () => {
    it('sends the promo campaign email with the promo code included', async () => {
      await dispatchPromoCampaign({
        recipients: [{ userId: 'u1', email: 'a@example.com' }],
        title: 'Promo spéciale',
        message: 'Profite de -20%',
        ctaLabel: "S'inscrire",
        ctaUrl: 'https://overbound-race.com/events/ultra-arena',
        promoCode: 'PROMO20',
      })

      expect(sendPromoCampaignEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({ promoCode: 'PROMO20', title: 'Promo spéciale' }),
      )
    })

    it('does nothing when there are no recipients', async () => {
      await dispatchPromoCampaign({
        recipients: [],
        title: 'Promo spéciale',
        message: 'Profite de -20%',
        ctaLabel: "S'inscrire",
        ctaUrl: 'https://overbound-race.com/events/ultra-arena',
      })

      expect(sendPromoCampaignEmailMock).not.toHaveBeenCalled()
    })
  })

  describe('digest frequency filtering', () => {
    it('filters out recipients whose digest_frequency preference is not "immediate"', async () => {
      supabaseAdminMock.mockReturnValue({
        from: () => ({
          select: () => ({
            in: async () => ({
              data: [
                { user_id: 'u1', digest_frequency: 'daily' },
                { user_id: 'u2', digest_frequency: 'immediate' },
              ],
              error: null,
            }),
          }),
        }),
      })

      await dispatchNewEventAnnouncement({
        recipients: [
          { userId: 'u1', email: 'daily@example.com' },
          { userId: 'u2', email: 'immediate@example.com' },
        ],
        eventTitle: 'Ultra Arena',
        eventDate: '12 septembre 2026',
        eventLocation: 'SQY',
        eventUrl: 'https://overbound-race.com/events/ultra-arena',
      })

      expect(sendNewEventAnnouncementEmailMock).toHaveBeenCalledTimes(1)
      expect(sendNewEventAnnouncementEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'immediate@example.com' }),
      )
    })

    it('defaults to sending when the preferences query errors out (backward compatibility)', async () => {
      supabaseAdminMock.mockReturnValue({
        from: () => ({
          select: () => ({
            in: async () => ({ data: null, error: new Error('db down') }),
          }),
        }),
      })

      await dispatchNewEventAnnouncement({
        recipients: [{ userId: 'u1', email: 'a@example.com' }],
        eventTitle: 'Ultra Arena',
        eventDate: '12 septembre 2026',
        eventLocation: 'SQY',
        eventUrl: 'https://overbound-race.com/events/ultra-arena',
      })

      expect(sendNewEventAnnouncementEmailMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('sendMarketingEmail', () => {
    it('sends and logs for each recipient using the provided sendFn', async () => {
      const sendFn = vi.fn().mockResolvedValue(undefined)

      await sendMarketingEmail('marketing_promo', [{ userId: 'u1', email: 'a@example.com' }], sendFn)

      expect(sendFn).toHaveBeenCalledTimes(1)
      expect(recordEmailLogMock).toHaveBeenCalledWith(
        expect.objectContaining({ emailType: 'marketing_promo' }),
      )
    })

    it('does nothing when RESEND_API_KEY is missing', async () => {
      delete process.env.RESEND_API_KEY
      const sendFn = vi.fn()

      await sendMarketingEmail('marketing_promo', [{ userId: 'u1', email: 'a@example.com' }], sendFn)

      expect(sendFn).not.toHaveBeenCalled()
    })
  })

  describe('recipient list helpers', () => {
    it('getRecipientsFromList delegates to getListRecipients', async () => {
      getListRecipientsMock.mockResolvedValue([{ email: 'a@example.com' }])

      const result = await getRecipientsFromList('events-announcements')

      expect(getListRecipientsMock).toHaveBeenCalledWith('events-announcements')
      expect(result).toEqual([{ email: 'a@example.com' }])
    })

    it('getRecipientsFromLists delegates to getMultipleListsRecipients', async () => {
      getMultipleListsRecipientsMock.mockResolvedValue([{ email: 'b@example.com' }])

      const result = await getRecipientsFromLists(['events-announcements', 'price-alerts'])

      expect(getMultipleListsRecipientsMock).toHaveBeenCalledWith(['events-announcements', 'price-alerts'])
      expect(result).toEqual([{ email: 'b@example.com' }])
    })

    it('getEventAnnouncementRecipients uses the events-announcements list', async () => {
      getListRecipientsMock.mockResolvedValue([])
      await getEventAnnouncementRecipients()
      expect(getListRecipientsMock).toHaveBeenCalledWith('events-announcements')
    })

    it('getPriceAlertRecipients uses the price-alerts list', async () => {
      getListRecipientsMock.mockResolvedValue([])
      await getPriceAlertRecipients()
      expect(getListRecipientsMock).toHaveBeenCalledWith('price-alerts')
    })
  })

  describe('getMarketingOptInRecipients', () => {
    it('aggregates recipients across the main marketing lists', async () => {
      getMultipleListsRecipientsMock.mockResolvedValue([{ email: 'a@example.com' }])

      const result = await getMarketingOptInRecipients()

      expect(getMultipleListsRecipientsMock).toHaveBeenCalledWith([
        'events-announcements',
        'price-alerts',
        'news-blog',
      ])
      expect(result).toEqual([{ email: 'a@example.com' }])
    })

    it('returns an empty array when the underlying lookup throws', async () => {
      getMultipleListsRecipientsMock.mockRejectedValue(new Error('db down'))

      const result = await getMarketingOptInRecipients()

      expect(result).toEqual([])
    })
  })
})
