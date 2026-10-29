import { createSign, generateKeyPairSync } from 'crypto'
import { describe, expect, it } from 'vitest'
import {
  buildStringToSign,
  isTrustedSnsUrl,
  parseSesEvent,
  snsMessageSchema,
  verifySnsSignature,
  type SnsMessage,
} from './sns'

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const publicPem = publicKey.export({ type: 'spki', format: 'pem' }).toString()

function signedNotification(overrides: Partial<SnsMessage> = {}): SnsMessage {
  const base = {
    Type: 'Notification' as const,
    MessageId: 'msg-1',
    TopicArn: 'arn:aws:sns:eu-west-3:123456789012:ses-events',
    Message: '{"eventType":"Bounce"}',
    Timestamp: '2026-10-28T10:00:00.000Z',
    SignatureVersion: '2',
    Signature: '',
    SigningCertURL: 'https://sns.eu-west-3.amazonaws.com/SimpleNotificationService-abc.pem',
    ...overrides,
  }
  const signer = createSign('RSA-SHA256')
  signer.update(buildStringToSign(base))
  return { ...base, Signature: signer.sign(privateKey, 'base64') }
}

describe('verifySnsSignature', () => {
  it('accepts a correctly signed notification', async () => {
    const result = await verifySnsSignature(signedNotification(), { getCertificate: async () => publicPem })
    expect(result).toBe(true)
  })

  it('rejects a message whose body was tampered with', async () => {
    const message = { ...signedNotification(), Message: '{"eventType":"Delivery"}' }
    expect(await verifySnsSignature(message, { getCertificate: async () => publicPem })).toBe(false)
  })

  it('rejects a signing certificate url outside amazonaws.com without fetching it', async () => {
    let fetched = false
    const message = signedNotification({ SigningCertURL: 'https://evil.example.com/cert.pem' })
    const result = await verifySnsSignature(message, {
      getCertificate: async () => {
        fetched = true
        return publicPem
      },
    })
    expect(result).toBe(false)
    expect(fetched).toBe(false)
  })

  it('rejects a malformed signature instead of throwing', async () => {
    const message = { ...signedNotification(), Signature: 'not-base64-signature' }
    expect(await verifySnsSignature(message, { getCertificate: async () => publicPem })).toBe(false)
  })
})

describe('isTrustedSnsUrl', () => {
  it.each([
    ['https://sns.eu-west-3.amazonaws.com/cert.pem', true],
    ['https://sns.us-east-1.amazonaws.com/x', true],
    ['http://sns.eu-west-3.amazonaws.com/cert.pem', false],
    ['https://sns.eu-west-3.amazonaws.com.evil.com/cert.pem', false],
    ['https://evil.com/sns.eu-west-3.amazonaws.com', false],
    ['not a url', false],
  ])('%s -> %s', (url, expected) => {
    expect(isTrustedSnsUrl(url)).toBe(expected)
  })
})

describe('parseSesEvent', () => {
  it('extracts every recipient of a permanent bounce', () => {
    const event = parseSesEvent(
      JSON.stringify({
        eventType: 'Bounce',
        bounce: {
          bounceType: 'Permanent',
          bouncedRecipients: [{ emailAddress: 'a@x.fr' }, { emailAddress: 'b@x.fr' }],
        },
      }),
    )
    expect(event).toEqual({ kind: 'suppress', reason: 'bounce', emails: ['a@x.fr', 'b@x.fr'] })
  })

  it('ignores transient bounces', () => {
    const event = parseSesEvent(
      JSON.stringify({
        eventType: 'Bounce',
        bounce: { bounceType: 'Transient', bouncedRecipients: [{ emailAddress: 'a@x.fr' }] },
      }),
    )
    expect(event).toEqual({ kind: 'ignore' })
  })

  it('maps complaints, including the legacy notificationType field', () => {
    const event = parseSesEvent(
      JSON.stringify({
        notificationType: 'Complaint',
        complaint: { complainedRecipients: [{ emailAddress: 'c@x.fr' }] },
      }),
    )
    expect(event).toEqual({ kind: 'suppress', reason: 'complaint', emails: ['c@x.fr'] })
  })

  it('ignores delivery events and malformed payloads', () => {
    expect(parseSesEvent('{"eventType":"Delivery"}')).toEqual({ kind: 'ignore' })
    expect(parseSesEvent('not json')).toEqual({ kind: 'ignore' })
  })
})

describe('snsMessageSchema', () => {
  it('rejects a body without signature fields', () => {
    expect(snsMessageSchema.safeParse({ Type: 'Notification' }).success).toBe(false)
  })
})
