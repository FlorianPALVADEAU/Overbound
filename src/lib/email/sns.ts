import { createVerify } from 'crypto'
import { z } from 'zod'

export const snsMessageSchema = z.object({
  Type: z.enum(['Notification', 'SubscriptionConfirmation', 'UnsubscribeConfirmation']),
  MessageId: z.string().min(1),
  TopicArn: z.string().min(1),
  Message: z.string(),
  Timestamp: z.string().min(1),
  SignatureVersion: z.string().min(1),
  Signature: z.string().min(1),
  SigningCertURL: z.string().min(1),
  Subject: z.string().optional(),
  SubscribeURL: z.string().optional(),
  Token: z.string().optional(),
})

export type SnsMessage = z.infer<typeof snsMessageSchema>

const TRUSTED_SNS_HOST = /^sns\.[a-z0-9-]+\.amazonaws\.com(\.cn)?$/

/** SNS only ever serves certificates and confirmation links from sns.<region>.amazonaws.com. */
export function isTrustedSnsUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && TRUSTED_SNS_HOST.test(url.hostname)
  } catch {
    return false
  }
}

export function buildStringToSign(message: SnsMessage): string {
  const fields =
    message.Type === 'Notification'
      ? ['Message', 'MessageId', ...(message.Subject !== undefined ? ['Subject'] : []), 'Timestamp', 'TopicArn', 'Type']
      : ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type']

  return fields
    .map((name) => `${name}\n${(message as Record<string, string | undefined>)[name] ?? ''}\n`)
    .join('')
}

const certificateCache = new Map<string, string>()

async function fetchCertificate(url: string): Promise<string> {
  const cached = certificateCache.get(url)
  if (cached) return cached

  const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
  if (!response.ok) {
    throw new Error(`SNS certificate fetch failed with status ${response.status}`)
  }
  const pem = await response.text()
  certificateCache.set(url, pem)
  return pem
}

/**
 * Verifies an SNS message signature. Returns false for any invalid input.
 * Throws only when the certificate cannot be fetched (caller should answer 5xx so SNS retries).
 */
export async function verifySnsSignature(
  message: SnsMessage,
  deps: { getCertificate?: (url: string) => Promise<string> } = {},
): Promise<boolean> {
  if (!isTrustedSnsUrl(message.SigningCertURL)) return false
  if (message.SignatureVersion !== '1' && message.SignatureVersion !== '2') return false

  const certificate = await (deps.getCertificate ?? fetchCertificate)(message.SigningCertURL)

  try {
    const verifier = createVerify(message.SignatureVersion === '2' ? 'RSA-SHA256' : 'RSA-SHA1')
    verifier.update(buildStringToSign(message))
    return verifier.verify(certificate, message.Signature, 'base64')
  } catch {
    return false
  }
}

export type SesEventAction =
  | { kind: 'suppress'; reason: 'bounce' | 'complaint'; emails: string[] }
  | { kind: 'ignore' }

const sesEventSchema = z.object({
  eventType: z.string().optional(),
  notificationType: z.string().optional(),
  bounce: z
    .object({
      bounceType: z.string(),
      bouncedRecipients: z.array(z.object({ emailAddress: z.string() })),
    })
    .optional(),
  complaint: z
    .object({
      complainedRecipients: z.array(z.object({ emailAddress: z.string() })),
    })
    .optional(),
})

/** Decides what a SES event (SNS `Message` body) means for the suppression list. */
export function parseSesEvent(rawMessage: string): SesEventAction {
  let json: unknown
  try {
    json = JSON.parse(rawMessage)
  } catch {
    return { kind: 'ignore' }
  }

  const parsed = sesEventSchema.safeParse(json)
  if (!parsed.success) return { kind: 'ignore' }

  const event = parsed.data
  const type = event.eventType ?? event.notificationType

  if (type === 'Bounce' && event.bounce?.bounceType === 'Permanent') {
    return {
      kind: 'suppress',
      reason: 'bounce',
      emails: event.bounce.bouncedRecipients.map((r) => r.emailAddress),
    }
  }
  if (type === 'Complaint' && event.complaint) {
    return {
      kind: 'suppress',
      reason: 'complaint',
      emails: event.complaint.complainedRecipients.map((r) => r.emailAddress),
    }
  }
  return { kind: 'ignore' }
}
