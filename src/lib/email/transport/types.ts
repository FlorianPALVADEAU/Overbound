export interface MarketingEmailMessage {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  /** Absolute URL, used for both the List-Unsubscribe header and one-click POST. */
  unsubscribeUrl: string
}

export type SendFailureKind = 'transient' | 'permanent'

export interface SendFailure {
  kind: SendFailureKind
  code: string
  message: string
}

export type SendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: SendFailure }
