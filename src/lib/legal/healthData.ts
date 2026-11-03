import { MINOR_CONTACT_FIELDS } from '@/lib/checkout/minorContacts'

/**
 * Medical notes are health data (art. 9 GDPR): they are only kept when the
 * participant ticked the dedicated, explicit consent. Without it they are dropped.
 */
export const keepHealthDataWithConsent = (medicalInfo: string | null | undefined, consent: boolean | null | undefined) => {
  const text = medicalInfo?.trim() ?? ''
  return consent === true ? text : ''
}

export const needsHealthDataConsent = (medicalInfo: string | null | undefined) => Boolean(medicalInfo?.trim())

export const HEALTH_DATA_CONSENT_LABEL =
  'J’accepte qu’Overbound conserve ces informations de santé pour les transmettre aux secours si besoin. Elles sont supprimées au plus tard 30 jours après l’événement. Je peux retirer cet accord à tout moment.'

/** Days after the event during which health notes and emergency contacts are still kept. */
export const SAFETY_DATA_RETENTION_DAYS = 30

/**
 * Removes the safety-only fields of a signed waiver: health notes and the
 * third-party emergency contact. Used once the bib changes hands (the former
 * holder no longer runs) and once the event is over. Identity and signature stay,
 * as proof of what was signed. Returns null when the data cannot be read.
 */
export const redactParticipantSafetyData = (signatureData: string, now: Date): string | null => {
  let parsed: unknown
  try {
    parsed = JSON.parse(signatureData)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const record = parsed as { participant?: Record<string, unknown> }
  const participant = record.participant ?? {}
  // A minor's representative and adult on site are contacts for the day too: cleared when present.
  const minorContacts = Object.fromEntries(MINOR_CONTACT_FIELDS.filter((field) => field in participant).map((field) => [field, '']))
  return JSON.stringify({
    ...record,
    participant: {
      ...participant,
      medicalInfo: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      ...minorContacts,
    },
    safetyDataRedactedAt: now.toISOString(),
  })
}

export const isSafetyDataRedacted = (signatureData: string) => signatureData.includes('"safetyDataRedactedAt"')
