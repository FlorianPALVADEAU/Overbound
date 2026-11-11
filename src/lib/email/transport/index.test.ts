import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { sesMock, resendMock } = vi.hoisted(() => ({ sesMock: vi.fn(), resendMock: vi.fn() }))

vi.mock('./ses', () => ({ sendMarketingEmail: sesMock }))
vi.mock('./resend', () => ({ sendMarketingEmailViaResend: resendMock }))

import { deliverMarketingMail, MARKETING_REPLY_TO } from './index'

const message = { to: 'a@x.fr', subject: 'S', html: '<p>x</p>', unsubscribeUrl: 'https://x.test/u' }

describe('deliverMarketingMail reply-to', () => {
  beforeEach(() => {
    sesMock.mockResolvedValue({ ok: true, messageId: 'm' })
    resendMock.mockResolvedValue({ ok: true, messageId: 'm' })
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('adds the team mailbox as reply-to on SES', async () => {
    vi.stubEnv('MARKETING_TRANSPORT', 'ses')

    await deliverMarketingMail(message)

    expect(sesMock).toHaveBeenCalledWith(expect.objectContaining({ replyTo: MARKETING_REPLY_TO }))
    expect(resendMock).not.toHaveBeenCalled()
  })

  it('adds it on Resend too', async () => {
    vi.stubEnv('MARKETING_TRANSPORT', '')

    await deliverMarketingMail(message)

    expect(resendMock).toHaveBeenCalledWith(expect.objectContaining({ replyTo: MARKETING_REPLY_TO }))
  })

  it('keeps an explicit reply-to', async () => {
    vi.stubEnv('MARKETING_TRANSPORT', 'ses')

    await deliverMarketingMail({ ...message, replyTo: 'other@x.fr' })

    expect(sesMock).toHaveBeenCalledWith(expect.objectContaining({ replyTo: 'other@x.fr' }))
  })
})
