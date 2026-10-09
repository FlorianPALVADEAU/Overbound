import type { SessionProfile } from '@/app/api/session/sessionQueries'

export type ProfileField = 'full_name' | 'phone' | 'date_of_birth'

const REQUIRED_PROFILE_FIELDS: ReadonlyArray<{ field: ProfileField; label: string }> = [
  { field: 'full_name', label: 'nom' },
  { field: 'phone', label: 'téléphone' },
  { field: 'date_of_birth', label: 'date de naissance' },
]

export interface ProfileCompletion {
  isComplete: boolean
  missing: Array<{ field: ProfileField; label: string }>
}

/** Same three fields the header badge and the registration funnel require. */
export const getProfileCompletion = (
  profile: Pick<SessionProfile, ProfileField> | null | undefined,
): ProfileCompletion => {
  const missing = REQUIRED_PROFILE_FIELDS.filter(({ field }) => !profile?.[field]?.toString().trim())
  return { isComplete: missing.length === 0, missing }
}

export const getInitials = (name: string | null | undefined, fallback: string | null | undefined) => {
  const source = (name?.trim() || fallback?.trim() || 'A').split('@')[0] ?? 'A'
  const letters = source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  return (letters || 'A').slice(0, 2)
}
