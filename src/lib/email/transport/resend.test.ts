import { afterEach, describe, expect, it, vi } from 'vitest'
import { classifyResendError, sendMarketingEmailViaResend } from './resend'
import { getMarketingTransportName } from './index'

const message = {
  to: 'a@x.fr',
  subject: 'Hello',
  html: '<p>Hi</p>',
  unsubscribeUrl: 'https://site.test/unsubscribe/tok',
}

describe('sendMarketingEmailViaResend', () => {
  it('sends with the unsubscribe headers and returns the message id', async () => {
    const send = vi.fn().mockResolvedValue({ data: { id: 'r-1' }, error: null })

    const result = await sendMarketingEmailViaResend(message, { client: { emails: { send } } })

    expect(result).toEqual({ ok: true, messageId: 'r-1' })
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@x.fr',
        headers: {
          'List-Unsubscribe': '<https://site.test/unsubscribe/tok>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    )
  })

  it('returns a transient failure for a rate limit and a permanent one for a validation error', async () => {
    const rateLimited = vi.fn().mockResolvedValue({ data: null, error: { name: 'rate_limit_exceeded', message: 'slow' } })
    const invalid = vi.fn().mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'bad to' } })

    expect(await sendMarketingEmailViaResend(message, { client: { emails: { send: rateLimited } } })).toMatchObject({
      ok: false,
      error: { kind: 'transient', code: 'rate_limit_exceeded' },
    })
    expect(await sendMarketingEmailViaResend(message, { client: { emails: { send: invalid } } })).toMatchObject({
      ok: false,
      error: { kind: 'permanent', code: 'validation_error' },
    })
  })

  it('treats a network exception as transient instead of throwing', async () => {
    const send = vi.fn().mockRejectedValue(new Error('socket hang up'))

    expect(await sendMarketingEmailViaResend(message, { client: { emails: { send } } })).toMatchObject({
      ok: false,
      error: { kind: 'transient', message: 'socket hang up' },
    })
  })

  it('refuses a message without an unsubscribe URL', async () => {
    const send = vi.fn()

    const result = await sendMarketingEmailViaResend({ ...message, unsubscribeUrl: '' }, { client: { emails: { send } } })

    expect(result).toMatchObject({ ok: false, error: { kind: 'permanent', code: 'UNSUBSCRIBE_URL_MISSING' } })
    expect(send).not.toHaveBeenCalled()
  })

  it('classifies quota errors as retryable', () => {
    expect(classifyResendError({ name: 'daily_quota_exceeded', message: 'q' }).kind).toBe('transient')
  })
})

describe('getMarketingTransportName', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('defaults to resend and switches to ses only on an explicit setting', () => {
    expect(getMarketingTransportName()).toBe('resend')
    vi.stubEnv('MARKETING_TRANSPORT', ' SES ')
    expect(getMarketingTransportName()).toBe('ses')
    vi.stubEnv('MARKETING_TRANSPORT', 'something-else')
    expect(getMarketingTransportName()).toBe('resend')
  })
})
