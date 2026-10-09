import type { AccountParticipant } from '@/types/AccountRegistration'

const asTrimmedString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

/**
 * The participant identity typed at checkout is stored inside the signed
 * waiver (`registration_signatures.signature_data`). Only the identity fields
 * are read; the signature image never leaves the server.
 */
export const parseParticipantFromSignature = (signatureData: string | null | undefined): AccountParticipant | null => {
  if (!signatureData) return null
  try {
    const parsed: unknown = JSON.parse(signatureData)
    const participant = (parsed as { participant?: Record<string, unknown> } | null)?.participant
    if (!participant) return null

    const first_name = asTrimmedString(participant.firstName)
    const last_name = asTrimmedString(participant.lastName)
    const birth_date = asTrimmedString(participant.birthDate)
    if (!first_name && !last_name) return null

    return { first_name, last_name, birth_date: /^\d{4}-\d{2}-\d{2}/.test(birth_date) ? birth_date.slice(0, 10) : null }
  } catch {
    return null
  }
}

/** « Camille DUPONT » — surname upper-cased like on a bib list. */
export const formatParticipantName = (participant: Pick<AccountParticipant, 'first_name' | 'last_name'>) =>
  [participant.first_name, participant.last_name.toUpperCase()].filter(Boolean).join(' ')

/** Full years at `now`; null when the date is missing, invalid or in the future. */
export const computeAge = (birthDate: string | null | undefined, now: Date): number | null => {
  if (!birthDate) return null
  const birth = new Date(`${birthDate}T00:00:00Z`)
  if (Number.isNaN(birth.getTime()) || birth.getTime() > now.getTime()) return null
  let age = now.getUTCFullYear() - birth.getUTCFullYear()
  const beforeBirthday =
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())
  if (beforeBirthday) age -= 1
  return age
}

export interface ParticipantIdentity {
  name: string | null
  age: number | null
  /** Photo of the account holder; only known for the holder's own bibs. */
  avatarUrl: string | null
}

/** Identity shown on a bib: the participant, else the holder's own profile for their own bib, else nothing. */
export const resolveParticipantIdentity = (
  participant: AccountParticipant | null | undefined,
  fallback: { fullName: string | null | undefined; birthDate: string | null | undefined; avatarUrl?: string | null } | null,
  now: Date,
): ParticipantIdentity => {
  if (participant) {
    return { name: formatParticipantName(participant), age: computeAge(participant.birth_date, now), avatarUrl: fallback?.avatarUrl ?? null }
  }
  if (fallback?.fullName?.trim()) {
    return { name: fallback.fullName.trim(), age: computeAge(fallback.birthDate, now), avatarUrl: fallback.avatarUrl ?? null }
  }
  return { name: null, age: null, avatarUrl: fallback?.avatarUrl ?? null }
}
