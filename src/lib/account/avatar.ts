export const AVATAR_BUCKET = 'avatars'
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
/** Side of the square the browser crops the chosen photo to before uploading. */
export const AVATAR_SIZE_PX = 512

export type AvatarImageType = 'webp' | 'jpeg' | 'png'

const CONTENT_TYPES: Record<AvatarImageType, string> = { webp: 'image/webp', jpeg: 'image/jpeg', png: 'image/png' }

export const avatarContentType = (type: AvatarImageType) => CONTENT_TYPES[type]

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((value, index) => bytes[offset + index] === value)

/** Sniffs the real format from the file header: the declared MIME type is never trusted. */
export const detectImageType = (bytes: Uint8Array): AvatarImageType | null => {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg'
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png'
  // RIFF....WEBP
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp'
  return null
}

export type AvatarValidation = { ok: true; type: AvatarImageType } | { ok: false; error: string }

export const validateAvatarUpload = (bytes: Uint8Array): AvatarValidation => {
  if (bytes.byteLength === 0) return { ok: false, error: 'Fichier vide.' }
  if (bytes.byteLength > AVATAR_MAX_BYTES) return { ok: false, error: 'Photo trop lourde (2 Mo maximum).' }
  const type = detectImageType(bytes)
  if (!type) return { ok: false, error: 'Format non supporté : utilise une photo JPEG, PNG ou WebP.' }
  return { ok: true, type }
}

/** Unique path per upload so CDN/browser caches never serve a replaced photo. */
export const buildAvatarPath = (userId: string, type: AvatarImageType, now: Date = new Date()) =>
  `${userId}/${now.getTime()}.${type === 'jpeg' ? 'jpg' : type}`

/** Photo Google (or another OAuth provider) put in the auth metadata at sign-up. */
export const pickProviderAvatar = (metadata: unknown): string | null => {
  const source = (metadata ?? {}) as Record<string, unknown>
  for (const key of ['avatar_url', 'picture']) {
    const value = source[key]
    if (typeof value === 'string' && /^https:\/\//.test(value)) return value
  }
  return null
}

/** Storage path (inside the bucket) of one of our own uploaded photos, or null for external URLs. */
export const storagePathFromPublicUrl = (url: string | null | undefined): string | null => {
  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`
  const index = url?.indexOf(marker) ?? -1
  return url && index >= 0 ? decodeURIComponent(url.slice(index + marker.length)) : null
}
