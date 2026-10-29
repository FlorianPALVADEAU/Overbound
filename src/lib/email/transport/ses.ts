import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import type { MarketingEmailMessage, SendFailure, SendResult } from './types'

export interface SesConfig {
  from: string
  configurationSet: string
}

interface SesSender {
  send: (command: SendEmailCommand) => Promise<{ MessageId?: string }>
}

const PERMANENT_ERROR_NAMES = new Set([
  'MessageRejected',
  'AccountSuspendedException',
  'SendingPausedException',
  'MailFromDomainNotVerifiedException',
  'NotFoundException',
  'BadRequestException',
])

const TRANSIENT_ERROR_NAMES = new Set([
  'TooManyRequestsException',
  'LimitExceededException',
  'InternalServiceErrorException',
  'ServiceUnavailable',
  'ThrottlingException',
])

let cachedClient: SESv2Client | null = null

function getClient(): SESv2Client {
  cachedClient ??= new SESv2Client({ region: process.env.AWS_REGION })
  return cachedClient
}

function readConfig(): SesConfig {
  return {
    from: process.env.SES_FROM_MARKETING ?? '',
    configurationSet: process.env.SES_CONFIGURATION_SET ?? '',
  }
}

export function classifySesError(error: unknown): SendFailure {
  if (!(error instanceof Error)) {
    return { kind: 'transient', code: 'UNKNOWN', message: String(error) }
  }

  const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode

  if (PERMANENT_ERROR_NAMES.has(error.name)) {
    return { kind: 'permanent', code: error.name, message: error.message }
  }
  if (TRANSIENT_ERROR_NAMES.has(error.name) || status === 429 || (status !== undefined && status >= 500)) {
    return { kind: 'transient', code: error.name, message: error.message }
  }
  if (status !== undefined && status >= 400) {
    return { kind: 'permanent', code: error.name, message: error.message }
  }
  // Unknown error (network, timeout): retry rather than lose the email.
  return { kind: 'transient', code: error.name, message: error.message }
}

function failure(kind: SendFailure['kind'], code: string, message: string): SendResult {
  return { ok: false, error: { kind, code, message } }
}

/**
 * Sends one marketing email through Amazon SES. Marketing only: transactional
 * email stays on Resend. Expected failures are returned, never thrown.
 */
export async function sendMarketingEmail(
  message: MarketingEmailMessage,
  deps: { client?: SesSender; config?: SesConfig } = {},
): Promise<SendResult> {
  const config = deps.config ?? readConfig()

  if (!config.from || !config.configurationSet) {
    return failure('permanent', 'CONFIG_MISSING', 'SES_FROM_MARKETING or SES_CONFIGURATION_SET is not set')
  }
  if (!message.unsubscribeUrl) {
    return failure('permanent', 'UNSUBSCRIBE_URL_MISSING', 'Marketing email requires an unsubscribe URL')
  }

  const command = new SendEmailCommand({
    FromEmailAddress: config.from,
    ConfigurationSetName: config.configurationSet,
    Destination: { ToAddresses: [message.to] },
    ReplyToAddresses: message.replyTo ? [message.replyTo] : undefined,
    Content: {
      Simple: {
        Subject: { Data: message.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: message.html, Charset: 'UTF-8' },
          ...(message.text ? { Text: { Data: message.text, Charset: 'UTF-8' } } : {}),
        },
        Headers: [
          { Name: 'List-Unsubscribe', Value: `<${message.unsubscribeUrl}>` },
          { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' },
        ],
      },
    },
  })

  try {
    const response = await (deps.client ?? getClient()).send(command)
    return { ok: true, messageId: response.MessageId ?? '' }
  } catch (error) {
    return { ok: false, error: classifySesError(error) }
  }
}
