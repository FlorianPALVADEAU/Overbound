import { sendMarketingEmailViaResend } from './resend'
import { sendMarketingEmail as sendMarketingEmailViaSes } from './ses'
import type { MarketingEmailMessage, SendResult } from './types'

export type MarketingTransportName = 'ses' | 'resend'

/** MARKETING_TRANSPORT=ses routes marketing mail through Amazon SES; anything else keeps Resend. */
export function getMarketingTransportName(): MarketingTransportName {
  return process.env.MARKETING_TRANSPORT?.trim().toLowerCase() === 'ses' ? 'ses' : 'resend'
}

/** False when the selected provider lacks its credentials: nothing must be recorded as failed then. */
export function isMarketingTransportConfigured(): boolean {
  if (getMarketingTransportName() === 'ses') {
    return Boolean(process.env.AWS_REGION && process.env.SES_FROM_MARKETING && process.env.SES_CONFIGURATION_SET)
  }
  return Boolean(process.env.RESEND_API_KEY)
}

/** The only entry point for marketing mail. Transactional mail never goes through here. */
export function deliverMarketingMail(message: MarketingEmailMessage): Promise<SendResult> {
  return getMarketingTransportName() === 'ses'
    ? sendMarketingEmailViaSes(message)
    : sendMarketingEmailViaResend(message)
}

export type { MarketingEmailMessage, SendFailure, SendResult } from './types'
