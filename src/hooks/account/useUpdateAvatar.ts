'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ACCOUNT_REGISTRATIONS_QUERY_KEY,
  type AccountRegistrationsResponse,
} from '@/app/api/account/registrations/accountRegistrationsQueries'
import { SESSION_QUERY_KEY, type SessionResponse } from '@/app/api/session/sessionQueries'
import { cropAvatar } from '@/lib/account/cropAvatar'
import { getClientAuthHeaders } from '@/lib/auth/getClientAuthHeaders'

type AvatarChange = { kind: 'upload'; file: File } | { kind: 'remove' }

const sendAvatar = async (change: AvatarChange): Promise<string | null> => {
  const body = change.kind === 'upload' ? new FormData() : undefined
  if (body && change.kind === 'upload') body.append('file', await cropAvatar(change.file), 'avatar.webp')

  const send = async (forceRefresh: boolean) =>
    fetch('/api/account/avatar', {
      method: change.kind === 'upload' ? 'POST' : 'DELETE',
      headers: await getClientAuthHeaders({ forceRefresh }),
      body,
      credentials: 'include',
    })

  let response = await send(false)
  if (response.status === 401) response = await send(true)
  const payload = (await response.json().catch(() => ({}))) as { avatar_url?: string | null; error?: string }
  if (!response.ok) throw new Error(payload.error || 'Impossible de mettre à jour la photo.')
  return payload.avatar_url ?? null
}

/** Uploads or removes the profile photo, then refreshes every cached copy that displays it. */
export function useUpdateAvatar() {
  const queryClient = useQueryClient()

  return useMutation<string | null, Error, AvatarChange>({
    mutationFn: sendAvatar,
    onSuccess: (avatarUrl) => {
      queryClient.setQueryData<AccountRegistrationsResponse | undefined>(ACCOUNT_REGISTRATIONS_QUERY_KEY, (previous) =>
        previous?.profile ? { ...previous, profile: { ...previous.profile, avatar_url: avatarUrl } } : previous,
      )
      queryClient.setQueryData<SessionResponse | undefined>(SESSION_QUERY_KEY, (previous) =>
        previous?.profile ? { ...previous, profile: { ...previous.profile, avatar_url: avatarUrl } } : previous,
      )
      // Group member lists carry the photo too.
      void queryClient.invalidateQueries({ queryKey: ['group', 'my'] })
    },
  })
}
