import { supabaseAdmin } from '@/lib/supabase/server'

export type SuppressionReason = 'bounce' | 'complaint'

export type RecordSuppressionResult = { ok: true } | { ok: false; message: string }

const LOOKUP_CHUNK_SIZE = 200

/**
 * Adds an address to the marketing suppression list. A replayed event is a no-op.
 * A complaint also switches off the email-keyed rows of `list_subscriptions`; user-keyed rows
 * stay as they are because `profiles` carries no email, so the suppression list is the barrier
 * that audience resolution and sending must both honour.
 */
export async function recordSuppression(params: {
  email: string
  reason: SuppressionReason
  eventId: string
  details?: Record<string, unknown>
}): Promise<RecordSuppressionResult> {
  const email = params.email.trim().toLowerCase()
  const admin = supabaseAdmin()

  const { error } = await admin.from('email_suppressions').upsert(
    {
      email,
      reason: params.reason,
      source: 'ses',
      event_id: params.eventId,
      details: params.details ?? null,
    },
    { onConflict: 'email', ignoreDuplicates: true },
  )

  if (error) {
    return { ok: false, message: error.message }
  }

  if (params.reason === 'complaint') {
    const { error: unsubscribeError } = await admin
      .from('list_subscriptions')
      .update({ subscribed: false, unsubscribed_at: new Date().toISOString() })
      .ilike('email', email)

    if (unsubscribeError) {
      return { ok: false, message: unsubscribeError.message }
    }
  }

  return { ok: true }
}

/**
 * Drops suppressed addresses from a recipient list. Throws when the list cannot be read:
 * failing closed (no send) is safer for sender reputation than sending to everyone.
 */
export async function filterSuppressed<T extends { email: string }>(recipients: T[]): Promise<T[]> {
  if (recipients.length === 0) {
    return []
  }

  const admin = supabaseAdmin()
  const suppressed = new Set<string>()
  const emails = Array.from(new Set(recipients.map((r) => r.email.toLowerCase())))

  for (let i = 0; i < emails.length; i += LOOKUP_CHUNK_SIZE) {
    const { data, error } = await admin
      .from('email_suppressions')
      .select('email')
      .in('email', emails.slice(i, i + LOOKUP_CHUNK_SIZE))

    if (error) {
      throw new Error(error.message)
    }
    for (const row of data ?? []) {
      suppressed.add(row.email)
    }
  }

  return recipients.filter((r) => !suppressed.has(r.email.toLowerCase()))
}
