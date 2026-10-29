import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { verifyMock, recordMock } = vi.hoisted(() => ({
  verifyMock: vi.fn(),
  recordMock: vi.fn(),
}))

vi.mock('@/lib/email/sns', async () => {
  const actual = await vi.importActual<typeof import('@/lib/email/sns')>('@/lib/email/sns')
  return { ...actual, verifySnsSignature: verifyMock }
})
vi.mock('@/lib/email/suppression', () => ({ recordSuppression: recordMock }))

import { POST } from './route'

const TOPIC = 'arn:aws:sns:eu-west-3:123456789012:ses-events'

function snsRequest(overrides: Record<string, unknown> = {}) {
  const body = {
    Type: 'Notification',
    MessageId: 'sns-1',
    TopicArn: TOPIC,
    Message: JSON.stringify({
      eventType: 'Bounce',
      bounce: { bounceType: 'Permanent', bouncedRecipients: [{ emailAddress: 'Gone@X.fr' }] },
    }),
    Timestamp: '2026-10-28T10:00:00.000Z',
    SignatureVersion: '2',
    Signature: 'sig',
    SigningCertURL: 'https://sns.eu-west-3.amazonaws.com/cert.pem',
    ...overrides,
  }
  return new NextRequest('http://localhost/api/webhooks/ses', {
    method: 'POST',
    headers: { 'content-type': 'text/plain; charset=UTF-8' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/webhooks/ses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('SES_SNS_TOPIC_ARN', TOPIC)
    verifyMock.mockResolvedValue(true)
    recordMock.mockResolvedValue({ ok: true })
  })

  it('suppresses a permanently bounced address', async () => {
    const response = await POST(snsRequest())

    expect(response.status).toBe(200)
    expect(recordMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'Gone@X.fr', reason: 'bounce', eventId: 'sns-1:gone@x.fr' }),
    )
  })

  it('rejects an invalid signature with 401 and records nothing', async () => {
    verifyMock.mockResolvedValue(false)

    const response = await POST(snsRequest())

    expect(response.status).toBe(401)
    expect(recordMock).not.toHaveBeenCalled()
  })

  it('rejects a message from a foreign topic even when its signature is valid', async () => {
    const response = await POST(snsRequest({ TopicArn: 'arn:aws:sns:eu-west-3:999999999999:attacker' }))

    expect(response.status).toBe(401)
    expect(verifyMock).not.toHaveBeenCalled()
    expect(recordMock).not.toHaveBeenCalled()
  })

  it('answers 400 on a body that is not an SNS message', async () => {
    const request = new NextRequest('http://localhost/api/webhooks/ses', { method: 'POST', body: '{"hello":1}' })
    expect((await POST(request)).status).toBe(400)
  })

  it('answers 500 when persistence fails so SNS retries', async () => {
    recordMock.mockResolvedValue({ ok: false, message: 'db down' })

    expect((await POST(snsRequest())).status).toBe(500)
  })

  it('answers 503 when the signing certificate cannot be fetched', async () => {
    verifyMock.mockRejectedValue(new Error('cert fetch failed'))

    expect((await POST(snsRequest())).status).toBe(503)
  })

  it('acknowledges delivery events without suppressing anything', async () => {
    const response = await POST(snsRequest({ Message: '{"eventType":"Delivery"}' }))

    expect(response.status).toBe(200)
    expect(recordMock).not.toHaveBeenCalled()
  })

  it('confirms a subscription only on a trusted SubscribeURL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const ok = await POST(
      snsRequest({
        Type: 'SubscriptionConfirmation',
        Token: 't',
        SubscribeURL: 'https://sns.eu-west-3.amazonaws.com/?Action=ConfirmSubscription',
      }),
    )
    expect(ok.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    fetchMock.mockClear()
    const bad = await POST(
      snsRequest({
        Type: 'SubscriptionConfirmation',
        Token: 't',
        SubscribeURL: 'https://evil.example.com/confirm',
      }),
    )
    expect(bad.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()

    vi.unstubAllGlobals()
  })
})
