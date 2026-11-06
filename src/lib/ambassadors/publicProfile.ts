import { storagePathFromPublicUrl } from '@/lib/account/avatar'

export interface PublicListingState {
  is_active: boolean
  public_opt_in: boolean
  public_blocked: boolean
}

/** On the public page only when active, opted in and not hidden by the team. */
export const isPubliclyListed = (state: PublicListingState): boolean =>
  state.is_active && state.public_opt_in && !state.public_blocked

/** "Marie Dupont" becomes "Marie D.": a first name and an initial, never the full name. */
export const toPublicName = (fullName: string | null | undefined): string => {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Ambassadeur'
  const [first, ...rest] = parts
  const last = rest[rest.length - 1]
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first
}

/**
 * The photo shown publicly: only one the ambassador uploaded themselves. A provider (Google) photo
 * was never chosen for display, so it stays out and the card falls back to initials.
 */
export const publicPhotoUrl = (avatarUrl: string | null | undefined): string | null =>
  storagePathFromPublicUrl(avatarUrl) ? (avatarUrl ?? null) : null

export const PUBLIC_BIO_MAX = 120

/** Bio as stored: trimmed, line breaks and runs of spaces collapsed. Empty becomes null. */
export const normalizeBio = (value: string | null | undefined): string | null => {
  const text = (value ?? '').replace(/\s+/g, ' ').trim()
  return text === '' ? null : text
}
