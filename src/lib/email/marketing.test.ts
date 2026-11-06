import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  sendPriceChangeReminderEmailMock,
  sendPromoCampaignEmailMock,
  ledgerMock,
  filterSuppressedMock,
  supabaseAdminMock,
  getListRecipientsMock,
  getMultipleListsRecipientsMock,
} = vi.hoisted(() => ({
  sendPriceChangeReminderEmailMock: vi.fn(),
  sendPromoCampaignEmailMock: vi.fn(),
  ledgerMock: { loadFinished: vi.fn(), record: vi.fn() },
  filterSuppressedMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  getListRecipientsMock: vi.fn(),
  getMultipleListsRecipientsMock: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
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
  dispatchPriceChangeReminder,
  dispatchPromoCampaign,
  getRecipientsFromList,
  getRecipientsFromLists,
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

describe('email/marketing', () => {
  const originalResendKey = process.env.RESEND_API_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-resend-key'
    ledgerMock.loadFinished.mockResolvedValue(new Set())
    ledgerMock.record.mockResolvedValue({ ok: true })
    filterSuppressedMock.mockImplementation(async (recipients: unknown[]) => recipients)
    supabaseAdminMock.mockReturnValue(noPreferencesAdmin())
    sendPriceChangeReminderEmailMock.mockResolvedValue(sentOk)
    sendPromoCampaignEmailMock.mockResolvedValue(sentOk)
  })

  afterEach(() => {
    process.env.RESEND_API_KEY = originalResendKey
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
    const promo = {
      title: 'Promo spéciale',
      message: 'Profite de -20%',
      ctaLabel: "S'inscrire",
      ctaUrl: 'https://overbound-race.com/events/ultra-arena',
    }

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

      await dispatchPromoCampaign({
        ...promo,
        recipients: [
          { userId: 'u1', email: 'daily@example.com' },
          { userId: 'u2', email: 'immediate@example.com' },
        ],
      })

      expect(sendPromoCampaignEmailMock).toHaveBeenCalledTimes(1)
      expect(sendPromoCampaignEmailMock).toHaveBeenCalledWith(
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
        dispatchPromoCampaign({ ...promo, recipients: [{ userId: 'u1', email: 'a@example.com' }] }),
      ).rejects.toThrow('preference read failed')

      expect(sendPromoCampaignEmailMock).not.toHaveBeenCalled()
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
