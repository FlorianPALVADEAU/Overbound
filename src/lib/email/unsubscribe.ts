import crypto from 'crypto'

/**
 * Unsubscribe token payload
 */
export interface UnsubscribeTokenPayload {
  userId: string
  email: string
  listId?: string // Optional: specific list to unsubscribe from
  timestamp: number
}

/**
 * Generate a secure unsubscribe token using HMAC-SHA256
 * Token format: base64(payload).signature
 */
export function generateUnsubscribeToken(
  payload: Omit<UnsubscribeTokenPayload, 'timestamp'>
): string {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) {
    throw new Error('UNSUBSCRIBE_SECRET environment variable is not set')
  }

  // Add timestamp to payload
  const fullPayload: UnsubscribeTokenPayload = {
    ...payload,
    timestamp: Date.now(),
  }

  // Encode payload as base64
  const payloadStr = JSON.stringify(fullPayload)
  const payloadBase64 = Buffer.from(payloadStr).toString('base64url')

  // Generate HMAC signature
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payloadBase64)
  const signature = hmac.digest('base64url')

  // Return token as payload.signature
  return `${payloadBase64}.${signature}`
}

/**
 * Validate and decode an unsubscribe token
 * Returns the payload if valid, throws error if invalid or expired
 */
export function validateUnsubscribeToken(
  token: string
): UnsubscribeTokenPayload {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) {
    throw new Error('UNSUBSCRIBE_SECRET environment variable is not set')
  }

  // Split token into payload and signature
  const parts = token.split('.')
  if (parts.length !== 2) {
    throw new Error('Invalid token format')
  }

  const [payloadBase64, signature] = parts

  // Verify signature
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payloadBase64)
  const expectedSignature = hmac.digest('base64url')

  if (signature !== expectedSignature) {
    throw new Error('Invalid token signature')
  }

  // Decode payload
  let payload: UnsubscribeTokenPayload
  try {
    const payloadStr = Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    payload = JSON.parse(payloadStr)
  } catch (error) {
    throw new Error('Invalid token payload')
  }

  // Validate payload structure
  if (
    !payload.userId ||
    !payload.email ||
    !payload.timestamp ||
    typeof payload.timestamp !== 'number'
  ) {
    throw new Error('Invalid token payload structure')
  }

  // Check token expiration (90 days)
  const MAX_AGE = 90 * 24 * 60 * 60 * 1000 // 90 days in milliseconds
  const age = Date.now() - payload.timestamp
  if (age > MAX_AGE) {
    throw new Error('Token has expired')
  }

  return payload
}

/**
 * Generate an unsubscribe URL for an email
 */
export function generateUnsubscribeUrl(
  userId: string,
  email: string,
  listId?: string
): string {
  const token = generateUnsubscribeToken({ userId, email, listId })
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${baseUrl}/unsubscribe/${token}`
}

/**
 * Generate a preferences URL for an authenticated user
 */
export function generatePreferencesUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${baseUrl}/preferences`
}
