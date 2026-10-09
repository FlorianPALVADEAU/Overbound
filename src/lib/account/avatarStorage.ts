import type { SupabaseClient } from '@supabase/supabase-js'
import {
  AVATAR_BUCKET,
  avatarContentType,
  buildAvatarPath,
  pickProviderAvatar,
  storagePathFromPublicUrl,
  type AvatarImageType,
} from './avatar'

type Admin = Pick<SupabaseClient, 'from' | 'storage'>

const removeStoredAvatar = async (admin: Admin, url: string | null | undefined) => {
  const path = storagePathFromPublicUrl(url)
  if (!path) return
  const { error } = await admin.storage.from(AVATAR_BUCKET).remove([path])
  if (error) console.error('[avatar] could not delete previous photo', error)
}

const readCurrentAvatar = async (admin: Admin, userId: string) => {
  const { data, error } = await admin.from('profiles').select('avatar_url').eq('id', userId).maybeSingle()
  if (error) throw error
  return (data?.avatar_url as string | null | undefined) ?? null
}

/** Stores a validated photo, makes it the user's avatar and deletes the one it replaces. */
export async function saveUploadedAvatar(admin: Admin, userId: string, bytes: Uint8Array, type: AvatarImageType): Promise<string> {
  const previous = await readCurrentAvatar(admin, userId)

  const path = buildAvatarPath(userId, type)
  const { error: uploadError } = await admin.storage
    .from(AVATAR_BUCKET)
    .upload(path, bytes, { contentType: avatarContentType(type), cacheControl: '31536000', upsert: false })
  if (uploadError) throw uploadError

  const { data } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  const { error: updateError } = await admin
    .from('profiles')
    .update({ avatar_url: data.publicUrl, avatar_source: 'upload' })
    .eq('id', userId)
  if (updateError) {
    await admin.storage.from(AVATAR_BUCKET).remove([path])
    throw updateError
  }

  await removeStoredAvatar(admin, previous)
  return data.publicUrl
}

/** Drops the uploaded photo and goes back to the provider (Google) one, if the account has any. */
export async function resetAvatarToProvider(admin: Admin, userId: string, userMetadata: unknown): Promise<string | null> {
  const previous = await readCurrentAvatar(admin, userId)
  const provider = pickProviderAvatar(userMetadata)

  const { error } = await admin
    .from('profiles')
    .update({ avatar_url: provider, avatar_source: provider ? 'provider' : null })
    .eq('id', userId)
  if (error) throw error

  await removeStoredAvatar(admin, previous)
  return provider
}

/**
 * Login-time sync: keeps the provider photo up to date, but never replaces a
 * photo the user uploaded themselves.
 */
export async function syncProviderAvatar(admin: Admin, userId: string, userMetadata: unknown): Promise<void> {
  const provider = pickProviderAvatar(userMetadata)
  if (!provider) return

  const { error } = await admin
    .from('profiles')
    .update({ avatar_url: provider, avatar_source: 'provider' })
    .eq('id', userId)
    .or('avatar_source.is.null,avatar_source.eq.provider')
    .neq('avatar_url', provider)
  if (error) console.error('[avatar] provider sync failed', error)
}
