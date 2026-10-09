'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ACCOUNT_REGISTRATIONS_QUERY_KEY,
  type AccountRegistrationsResponse,
} from '@/app/api/account/registrations/accountRegistrationsQueries'
import { SESSION_QUERY_KEY, type SessionProfile, type SessionResponse } from '@/app/api/session/sessionQueries'
import { getClientAuthHeaders } from '@/lib/auth/getClientAuthHeaders'

export type ProfileUpdatePayload = Partial<Record<'full_name' | 'phone' | 'date_of_birth', string | null>>

interface UpdateProfileResponse {
  success: boolean
  profile?: SessionProfile | null
  error?: string
}

const patchProfile = async (payload: ProfileUpdatePayload): Promise<UpdateProfileResponse> => {
  const send = async (forceRefresh: boolean) =>
    fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(await getClientAuthHeaders({ forceRefresh })) },
      body: JSON.stringify(payload),
      credentials: 'include',
    })

  let response = await send(false)
  if (response.status === 401) response = await send(true)

  const data = (await response.json().catch(() => ({}))) as UpdateProfileResponse
  if (response.status === 401) throw new Error('Session expirée. Recharge la page et reconnecte-toi.')
  if (!response.ok) throw new Error(data.error || 'Impossible de mettre à jour le profil.')
  return data
}

/** Saves identity fields and keeps both cached copies of the profile (account + session/header) in sync. */
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation<UpdateProfileResponse, Error, ProfileUpdatePayload>({
    mutationFn: patchProfile,
    onSuccess: (data, sent) => {
      const merge = (previous: SessionProfile | null | undefined): SessionProfile => ({
        ...previous,
        ...sent,
        ...data.profile,
      })

      queryClient.setQueryData<AccountRegistrationsResponse | undefined>(ACCOUNT_REGISTRATIONS_QUERY_KEY, (previous) =>
        previous ? { ...previous, profile: merge(previous.profile) } : previous,
      )
      queryClient.setQueryData<SessionResponse | undefined>(SESSION_QUERY_KEY, (previous) =>
        previous ? { ...previous, profile: merge(previous.profile) } : previous,
      )
    },
  })
}
