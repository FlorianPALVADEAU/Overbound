'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getClientAuthHeaders } from '@/lib/auth/getClientAuthHeaders'

export interface AmbassadorPublicProfile {
  public_opt_in: boolean
  public_blocked: boolean
  is_listed: boolean
  public_bio: string | null
  public_show_group: boolean
  /** The ambassador's own group, if any: what would be shown when `public_show_group` is on. */
  group: { name: string; invite_code: string } | null
}

export type AmbassadorPublicPatch = Partial<Pick<AmbassadorPublicProfile, 'public_opt_in' | 'public_bio' | 'public_show_group'>>

const QUERY_KEY = ['ambassadors', 'public-profile'] as const

const request = async (method: 'GET' | 'PATCH', body?: AmbassadorPublicPatch): Promise<AmbassadorPublicProfile> => {
  const send = async (forceRefresh: boolean) =>
    fetch('/api/ambassadors/profile', {
      method,
      headers: { ...(await getClientAuthHeaders({ forceRefresh })), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      cache: 'no-store',
    })

  let response = await send(false)
  if (response.status === 401) response = await send(true)
  const payload = (await response.json().catch(() => ({}))) as Partial<AmbassadorPublicProfile> & { error?: string }
  if (!response.ok) throw new Error(payload.error || 'Impossible de charger ta page publique.')
  return payload as AmbassadorPublicProfile
}

/** Whether the ambassador appears on the public page, and the switch to change it. */
export function useAmbassadorPublicProfile(enabled: boolean) {
  const queryClient = useQueryClient()
  const query = useQuery<AmbassadorPublicProfile, Error>({ queryKey: QUERY_KEY, queryFn: () => request('GET'), enabled })
  const mutation = useMutation<AmbassadorPublicProfile, Error, AmbassadorPublicPatch>({
    mutationFn: (patch) => request('PATCH', patch),
    onSuccess: (profile) => queryClient.setQueryData(QUERY_KEY, profile),
  })
  return { query, mutation }
}
