import { describe, expect, it, vi } from 'vitest'
import { SendEmailCommand } from '@aws-sdk/client-sesv2'
import { classifySesError, sendMarketingEmail } from './ses'
import type { MarketingEmailMessage } from './types'

const message: MarketingEmailMessage = {
  to: 'runner@example.com',
  subject: 'Nouvelle édition',
  html: '<p>Salut</p>',
  text: 'Salut',
  unsubscribeUrl: 'https://www.overbound-race.com/api/unsubscribe?token=abc',
}

const config = {
  from: 'Overbound <news@email.overbound-race.com>',
  configurationSet: 'overbound-marketing',
}

describe('sendMarketingEmail', () => {
  it('sends through SES with unsubscribe headers and returns the message id', async () => {
    const send = vi.fn().mockResolvedValue({ MessageId: 'ses-123' })

    const result = await sendMarketingEmail(message, { client: { send }, config })

    expect(result).toEqual({ ok: true, messageId: 'ses-123' })
    const command = send.mock.calls[0][0] as SendEmailCommand
    expect(command).toBeInstanceOf(SendEmailCommand)
    expect(command.input.FromEmailAddress).toBe(config.from)
    expect(command.input.ConfigurationSetName).toBe('overbound-marketing')
    expect(command.input.Destination?.ToAddresses).toEqual(['runner@example.com'])
    expect(command.input.Content?.Simple?.Headers).toEqual([
      { Name: 'List-Unsubscribe', Value: `<${message.unsubscribeUrl}>` },
      { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' },
    ])
  })

  it('returns a permanent failure when SES rejects the message', async () => {
    const error = Object.assign(new Error('Email address is not verified'), {
      name: 'MessageRejected',
    })
    const send = vi.fn().mockRejectedValue(error)

    const result = await sendMarketingEmail(message, { client: { send }, config })

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'permanent',
        code: 'MessageRejected',
        message: 'Email address is not verified',
      },
    })
  })

  it('returns a transient failure when SES throttles', async () => {
    const error = Object.assign(new Error('Slow down'), {
      name: 'TooManyRequestsException',
    })
    const send = vi.fn().mockRejectedValue(error)

    const result = await sendMarketingEmail(message, { client: { send }, config })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.kind).toBe('transient')
  })

  it('returns a permanent CONFIG_MISSING failure without calling SES when config is absent', async () => {
    const send = vi.fn()

    const result = await sendMarketingEmail(message, {
      client: { send },
      config: { from: '', configurationSet: '' },
    })

    expect(send).not.toHaveBeenCalled()
    expect(result).toMatchObject({ ok: false, error: { kind: 'permanent', code: 'CONFIG_MISSING' } })
  })

  it('refuses a message without unsubscribe url', async () => {
    const send = vi.fn()

    const result = await sendMarketingEmail(
      { ...message, unsubscribeUrl: '' },
      { client: { send }, config },
    )

    expect(send).not.toHaveBeenCalled()
    expect(result).toMatchObject({ ok: false, error: { kind: 'permanent', code: 'UNSUBSCRIBE_URL_MISSING' } })
  })
})

describe('classifySesError', () => {
  it.each([
    ['MessageRejected', undefined, 'permanent'],
    ['AccountSuspendedException', undefined, 'permanent'],
    ['MailFromDomainNotVerifiedException', undefined, 'permanent'],
    ['TooManyRequestsException', undefined, 'transient'],
    ['LimitExceededException', undefined, 'transient'],
    ['InternalServiceErrorException', undefined, 'transient'],
    ['SomethingNew', 503, 'transient'],
    ['SomethingNew', 429, 'transient'],
    ['SomethingNew', 400, 'permanent'],
    ['SomethingNew', undefined, 'transient'],
  ])('%s (http %s) is %s', (name, status, expected) => {
    const error = Object.assign(new Error('boom'), {
      name,
      ...(status ? { $metadata: { httpStatusCode: status } } : {}),
    })
    expect(classifySesError(error).kind).toBe(expected)
  })

  it('treats non-error throwables as transient', () => {
    expect(classifySesError('weird').kind).toBe('transient')
  })
})
