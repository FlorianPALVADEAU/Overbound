import type { SessionProfile } from '@/app/api/session/sessionQueries'

export type ProfileField = 'first_name' | 'last_name' | 'phone' | 'date_of_birth'

/** Prénom et nom de famille d'un compte. Null si la personne n'a pas encore renseigné le champ. */
export interface ProfileName {
  first_name?: string | null
  last_name?: string | null
}

const REQUIRED_PROFILE_FIELDS: ReadonlyArray<{ field: ProfileField; label: string }> = [
  { field: 'first_name', label: 'prénom' },
  { field: 'last_name', label: 'nom' },
  { field: 'phone', label: 'téléphone' },
  { field: 'date_of_birth', label: 'date de naissance' },
]

export interface ProfileCompletion {
  isComplete: boolean
  missing: Array<{ field: ProfileField; label: string }>
}

/** Same four fields the header badge and the registration funnel require. */
export const getProfileCompletion = (
  profile: Pick<SessionProfile, ProfileField> | null | undefined,
): ProfileCompletion => {
  const missing = REQUIRED_PROFILE_FIELDS.filter(({ field }) => !profile?.[field]?.toString().trim())
  return { isComplete: missing.length === 0, missing }
}

/** « Prénom Nom » à partir des deux champs, null si les deux sont vides. */
export const formatProfileName = (name: ProfileName | null | undefined): string | null => {
  const joined = [name?.first_name, name?.last_name]
    .map((part) => part?.trim() ?? '')
    .filter(Boolean)
    .join(' ')
  return joined || null
}

/**
 * Découpe un nom complet (connexion Google, ancien formulaire) : premier mot = prénom, le reste = nom.
 * Un texte qui contient « @ » est un email : rien à reprendre.
 */
export const splitFullName = (fullName: string | null | undefined): { firstName: string | null; lastName: string | null } => {
  const trimmed = fullName?.trim() ?? ''
  if (!trimmed || trimmed.includes('@')) return { firstName: null, lastName: null }
  const [firstName = '', ...rest] = trimmed.split(/\s+/)
  return { firstName: firstName || null, lastName: rest.join(' ') || null }
}

/**
 * Prénom et nom d'un compte à partir des métadonnées d'authentification : champs posés à l'inscription, sinon
 * découpe du nom complet (connexion Google). Sert quand le profil n'est pas encore lu.
 */
export const profileNameFromUserMetadata = (metadata: Record<string, unknown> | null | undefined): ProfileName => {
  const explicitFirst = typeof metadata?.first_name === 'string' ? metadata.first_name.trim() : ''
  const explicitLast = typeof metadata?.last_name === 'string' ? metadata.last_name.trim() : ''
  if (explicitFirst || explicitLast) return { first_name: explicitFirst || null, last_name: explicitLast || null }
  const fullName = [metadata?.full_name, metadata?.name].find((value): value is string => typeof value === 'string')
  const split = splitFullName(fullName)
  return { first_name: split.firstName, last_name: split.lastName }
}

export const firstNameFromUserMetadata = (metadata: Record<string, unknown> | null | undefined): string | null =>
  profileNameFromUserMetadata(metadata).first_name ?? null

/** Prénom seul, pour les messages (« Salut Camille, »). */
export const getProfileFirstName = (name: ProfileName | null | undefined): string | null =>
  name?.first_name?.trim() || null

export const getInitials = (name: string | null | undefined, fallback: string | null | undefined) => {
  const source = (name?.trim() || fallback?.trim() || 'A').split('@')[0] ?? 'A'
  const letters = source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  return (letters || 'A').slice(0, 2)
}
