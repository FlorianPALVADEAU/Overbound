import { NextRequest, NextResponse } from 'next/server'
import {
  isTrustedSnsUrl,
  parseSesEvent,
  snsMessageSchema,
  verifySnsSignature,
} from '@/lib/email/sns'
import { recordSuppression } from '@/lib/email/suppression'

/**
 * POST /api/webhooks/ses
 * Receives SES bounce/complaint events through an SNS HTTPS subscription.
 * Order matters: shape -> topic -> signature, then act. 5xx makes SNS retry.
 */
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = JSON.parse(await request.text())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = snsMessageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid SNS message' }, { status: 400 })
  }
  const message = parsed.data

  const expectedTopic = process.env.SES_SNS_TOPIC_ARN
  if (!expectedTopic) {
    console.error('[webhooks/ses] SES_SNS_TOPIC_ARN is not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }
  // A valid SNS signature only proves the message came from SNS, not from our topic.
  if (message.TopicArn !== expectedTopic) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let signatureValid: boolean
  try {
    signatureValid = await verifySnsSignature(message)
  } catch (error) {
    console.error('[webhooks/ses] certificate fetch failed', error)
    return NextResponse.json({ error: 'Signature check unavailable' }, { status: 503 })
  }
  if (!signatureValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (message.Type === 'SubscriptionConfirmation') {
    if (!message.SubscribeURL || !isTrustedSnsUrl(message.SubscribeURL)) {
      return NextResponse.json({ error: 'Untrusted SubscribeURL' }, { status: 400 })
    }
    const confirmation = await fetch(message.SubscribeURL, { signal: AbortSignal.timeout(5000) })
    if (!confirmation.ok) {
      return NextResponse.json({ error: 'Subscription confirmation failed' }, { status: 502 })
    }
    return NextResponse.json({ confirmed: true })
  }

  if (message.Type === 'UnsubscribeConfirmation') {
    return NextResponse.json({ received: true })
  }

  const action = parseSesEvent(message.Message)
  if (action.kind === 'ignore') {
    return NextResponse.json({ received: true })
  }

  for (const email of action.emails) {
    const result = await recordSuppression({
      email,
      reason: action.reason,
      eventId: `${message.MessageId}:${email.trim().toLowerCase()}`,
    })
    if (!result.ok) {
      console.error('[webhooks/ses] suppression write failed', result.message)
      return NextResponse.json({ error: 'Persistence failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true, suppressed: action.emails.length })
}
