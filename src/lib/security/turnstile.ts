const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export type TurnstileVerdict =
  | { ok: true; skipped: boolean }
  | { ok: false; reason: 'missing-token' | 'rejected' | 'unreachable' }

/** The check is on once the secret key is set. Without it (local dev, key not yet created) forms still work. */
export const isTurnstileConfigured = () => Boolean(process.env.TURNSTILE_SECRET_KEY)

/**
 * Server-side check of a Cloudflare Turnstile token (docs: developers.cloudflare.com/turnstile).
 * A failed or unreachable verification blocks the request: a bot must not pass when Cloudflare is down.
 */
export async function verifyTurnstileToken(token: string | undefined, ip?: string): Promise<TurnstileVerdict> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return { ok: true, skipped: true }
  if (!token) return { ok: false, reason: 'missing-token' }

  const body = new URLSearchParams({ secret, response: token })
  if (ip && ip !== 'unknown') body.set('remoteip', ip)

  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return { ok: false, reason: 'unreachable' }
    const result = (await response.json()) as { success?: boolean }
    return result.success ? { ok: true, skipped: false } : { ok: false, reason: 'rejected' }
  } catch {
    return { ok: false, reason: 'unreachable' }
  }
}
