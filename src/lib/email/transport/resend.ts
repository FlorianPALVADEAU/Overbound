import { Resend } from 'resend'
import type { MarketingEmailMessage, SendFailure, SendResult } from './types'

interface ResendSender {
  emails: {
    send: (payload: {
      from: string
      to: string
      subject: string
      html: string
      text?: string
      replyTo?: string
      headers: Record<string, string>
    }) => Promise<{ data: { id: string } | null; error: { name: string; message: string } | null }>
  }
}

const DEFAULT_FROM = "Florian d'Overbound <no-reply@overbound-race.com>"

// Resend error names worth retrying; any other API error (validation, bad address) will not change.
const TRANSIENT_ERROR_NAMES = new Set([
  'rate_limit_exceeded',
  'daily_quota_exceeded',
  'monthly_quota_exceeded',
  'internal_server_error',
  'application_error',
])

let cachedClient: Resend | null = null

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  cachedClient ??= new Resend(apiKey)
  return cachedClient
}

export function classifyResendError(error: { name: string; message: string }): SendFailure {
  return {
    kind: TRANSIENT_ERROR_NAMES.has(error.name) ? 'transient' : 'permanent',
    code: error.name,
    message: error.message,
  }
}

/**
 * Fallback marketing transport (MARKETING_TRANSPORT unset): same contract as the SES one,
 * so switching providers is an environment change.
 */
export async function sendMarketingEmailViaResend(
  message: MarketingEmailMessage,
  deps: { client?: ResendSender } = {},
): Promise<SendResult> {
  if (!message.unsubscribeUrl) {
    return {
      ok: false,
      error: { kind: 'permanent', code: 'UNSUBSCRIBE_URL_MISSING', message: 'Marketing email requires an unsubscribe URL' },
    }
  }

  const client = deps.client ?? (getClient() as unknown as ResendSender | null)
  if (!client) {
    return {
      ok: false,
      error: { kind: 'permanent', code: 'CONFIG_MISSING', message: 'RESEND_API_KEY is not set' },
    }
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.SEND_FROM_EMAIL || DEFAULT_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo,
      headers: {
        'List-Unsubscribe': `<${message.unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })
    if (error) {
      return { ok: false, error: classifyResendError(error) }
    }
    return { ok: true, messageId: data?.id ?? '' }
  } catch (error) {
    // Network failure or timeout: retry rather than lose the email.
    return {
      ok: false,
      error: {
        kind: 'transient',
        code: error instanceof Error ? error.name : 'UNKNOWN',
        message: error instanceof Error ? error.message : String(error),
      },
    }
  }
}
