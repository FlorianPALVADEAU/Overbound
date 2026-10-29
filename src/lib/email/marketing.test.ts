import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  sendNewEventAnnouncementEmailMock,
  sendPriceChangeReminderEmailMock,
  sendPromoCampaignEmailMock,
  ledgerMock,
  filterSuppressedMock,
  supabaseAdminMock,
  getListRecipientsMock,
  getMultipleListsRecipientsMock,
} = vi.hoisted(() => ({
  sendNewEventAnnouncementEmailMock: vi.fn(),
  sendPriceChangeReminderEmailMock: vi.fn(),
  sendPromoCampaignEmailMock: vi.fn(),
  ledgerMock: { loadFinished: vi.fn(), record: vi.fn() },
  filterSuppressedMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  getListRecipientsMock: vi.fn(),
  getMultipleListsRecipientsMock: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendNewEventAnnouncementEmail: sendNewEventAnnouncementEmailMock,
  sendPriceChangeReminderEmail: sendPriceChangeReminderEmailMock,
  sendPromoCampaignEmail: sendPromoCampaignEmailMock,
}))

vi.mock('@/lib/email/campaignLedger', () => ({ supabaseCampaignLedger: ledgerMock }))
vi.mock('@/lib/email/suppression', () => ({ filterSuppressed: filterSuppressedMock }))

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

const sentOk = { ok: true, messageId: 'm-1' }
const event = {
  eventTitle: 'Ultra Arena',
  eventDate: '12 septembre 2026',
  eventLocation: 'SQY',
  eventUrl: 'https://overbound-race.com/events/ultra-arena',
}

describe('email/marketing', () => {
  const originalResendKey = process.env.RESEND_API_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-resend-key'
    ledgerMock.loadFinished.mockResolvedValue(new Set())
    ledgerMock.record.mockResolvedValue({ ok: true })
    filterSuppressedMock.mockImplementation(async (recipients: unknown[]) => recipients)
    supabaseAdminMock.mockReturnValue(noPreferencesAdmin())
    sendNewEventAnnouncementEmailMock.mockResolvedValue(sentOk)
    sendPriceChangeReminderEmailMock.mockResolvedValue(sentOk)
    sendPromoCampaignEmailMock.mockResolvedValue(sentOk)
  })

  afterEach(() => {
    process.env.RESEND_API_KEY = originalResendKey
  })

  describe('dispatchNewEventAnnouncement', () => {
    it('sends the announcement to every recipient and records it in the campaign ledger', async () => {
      const report = await dispatchNewEventAnnouncement({
        recipients: [{ userId: 'u1', email: 'a@example.com', fullName: 'Alice' }],
        ...event,
      })

      expect(sendNewEventAnnouncementEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'a@example.com', eventTitle: 'Ultra Arena' }),
      )
      expect(ledgerMock.record).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@example.com', status: 'sent', userId: 'u1' }),
      )
      expect(report).toMatchObject({ sent: 1, failed: 0 })
    })

    it('mails a subscriber without an account, which the old email_logs key could not record', async () => {
      await dispatchNewEventAnnouncement({ recipients: [{ email: 'guest@example.com' }], ...event })

      expect(sendNewEventAnnouncementEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'guest@example.com' }),
      )
      expect(ledgerMock.record).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'guest@example.com', userId: null, status: 'sent' }),
      )
    })

    it('records a provider rejection as failed instead of sent', async () => {
      sendNewEventAnnouncementEmailMock.mockResolvedValue({
        ok: false,
        error: { kind: 'permanent', code: 'validation_error', message: 'bad address' },
      })

      const report = await dispatchNewEventAnnouncement({ recipients: [{ email: 'a@example.com' }], ...event })

      expect(report).toMatchObject({ sent: 0, failed: 1 })
      expect(ledgerMock.record).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed_permanent' }))
    })

    it('does not mail an address that was already sent this campaign', async () => {
      ledgerMock.loadFinished.mockResolvedValue(new Set(['a@example.com']))

      await dispatchNewEventAnnouncement({ recipients: [{ email: 'a@example.com' }], ...event })

      expect(sendNewEventAnnouncementEmailMock).not.toHaveBeenCalled()
    })

    it('does not mail a suppressed address', async () => {
      filterSuppressedMock.mockResolvedValue([])

      await dispatchNewEventAnnouncement({ recipients: [{ email: 'bounced@example.com' }], ...event })

      expect(sendNewEventAnnouncementEmailMock).not.toHaveBeenCalled()
    })

    it('sends nothing when the selected provider is not configured', async () => {
      delete process.env.RESEND_API_KEY

      const report = await dispatchNewEventAnnouncement({
        recipients: [{ userId: 'u1', email: 'a@example.com' }],
        ...event,
      })

      expect(report).toBeNull()
      expect(sendNewEventAnnouncementEmailMock).not.toHaveBeenCalled()
      expect(ledgerMock.record).not.toHaveBeenCalled()
    })
  })

  describe('dispatchPriceChangeReminder', () => {
    const reminder = {
      eventTitle: 'Ultra Arena',
      eventDate: '12 septembre 2026',
      deadlineLabel: '31 mars',
      eventUrl: 'https://overbound-race.com/events/ultra-arena',
      currentPriceLabel: '49€',
    }

    it('sends the price change reminder to every recipient', async () => {
      await dispatchPriceChangeReminder({ recipients: [{ userId: 'u1', email: 'a@example.com' }], ...reminder })

      expect(sendPriceChangeReminderEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'a@example.com', deadlineLabel: '31 mars' }),
      )
    })

    it('uses a separate campaign per deadline, so the next reminder is not skipped', async () => {
      await dispatchPriceChangeReminder({ recipients: [{ email: 'a@example.com' }], ...reminder })
      await dispatchPriceChangeReminder({
        recipients: [{ email: 'a@example.com' }],
        ...reminder,
        deadlineLabel: '30 avril',
      })

      const keys = ledgerMock.loadFinished.mock.calls.map(([key]) => key)
      expect(keys).toHaveLength(2)
      expect(keys[0]).not.toBe(keys[1])
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
        ...event,
      })

      expect(sendNewEventAnnouncementEmailMock).toHaveBeenCalledTimes(1)
      expect(sendNewEventAnnouncementEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'immediate@example.com' }),
      )
    })

    it('sends to nobody when the preferences cannot be read, instead of mailing everyone', async () => {
      supabaseAdminMock.mockReturnValue({
        from: () => ({
          select: () => ({
            in: async () => ({ data: null, error: { message: 'db down' } }),
          }),
        }),
      })

      await expect(
        dispatchNewEventAnnouncement({ recipients: [{ userId: 'u1', email: 'a@example.com' }], ...event }),
      ).rejects.toThrow('preference read failed')

      expect(sendNewEventAnnouncementEmailMock).not.toHaveBeenCalled()
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
