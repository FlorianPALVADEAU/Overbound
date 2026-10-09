import type { SupabaseClient } from '@supabase/supabase-js'
import { SAFETY_DATA_RETENTION_DAYS, isSafetyDataRedacted, redactParticipantSafetyData } from './healthData'

type Admin = Pick<SupabaseClient, 'from'>

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Removes health notes and emergency contacts from the waivers of events that
 * ended more than `SAFETY_DATA_RETENTION_DAYS` ago, as promised to participants.
 * Idempotent: already-redacted signatures are skipped.
 */
export async function purgeSafetyDataAfterEvents(admin: Admin, now: Date): Promise<{ redacted: number }> {
  const cutoff = new Date(now.getTime() - SAFETY_DATA_RETENTION_DAYS * DAY_MS).toISOString()

  const { data: events, error: eventsError } = await admin.from('events').select('id').lt('date', cutoff)
  if (eventsError) throw eventsError
  const eventIds = (events ?? []).map((event) => event.id as string)
  if (eventIds.length === 0) return { redacted: 0 }

  const { data: registrations, error: registrationsError } = await admin
    .from('registrations')
    .select('id')
    .in('event_id', eventIds)
  if (registrationsError) throw registrationsError
  const registrationIds = (registrations ?? []).map((registration) => registration.id as string)
  if (registrationIds.length === 0) return { redacted: 0 }

  const { data: signatures, error: signaturesError } = await admin
    .from('registration_signatures')
    .select('id, signature_data')
    .in('registration_id', registrationIds)
  if (signaturesError) throw signaturesError

  let redacted = 0
  for (const signature of signatures ?? []) {
    const data = signature.signature_data as string | null
    if (!data || isSafetyDataRedacted(data)) continue
    const next = redactParticipantSafetyData(data, now)
    if (!next) continue
    const { error } = await admin.from('registration_signatures').update({ signature_data: next }).eq('id', signature.id)
    if (error) throw error
    redacted += 1
  }
  return { redacted }
}
