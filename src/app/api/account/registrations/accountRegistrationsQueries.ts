import { useQuery } from '@tanstack/react-query'
import type { SessionProfile, SessionUser } from '@/app/api/session/sessionQueries'
import type { AccountRegistrationItem } from '@/components/account/AccountRegistrationsList'
import { getClientAuthHeaders } from '@/lib/auth/getClientAuthHeaders'

export interface AccountRegistrationsResponse {
  user: SessionUser | null
  profile: SessionProfile | null
  stats: {
    totalEvents: number
    checkedInEvents: number
    upcomingEvents: number
  }
  registrations: AccountRegistrationItem[]
}

export const ACCOUNT_REGISTRATIONS_QUERY_KEY = ['account', 'registrations'] as const

const fetchAccountRegistrations = async (): Promise<AccountRegistrationsResponse> => {
  const doRequest = async (forceRefresh = false) => {
    const headers = await getClientAuthHeaders({ forceRefresh })
    return fetch('/api/account/registrations', {
      cache: 'no-store',
      headers,
      credentials: 'include', // Ensure cookies are sent with the request
    })
  }

  let response = await doRequest()

  if (response.status === 401) {
    response = await doRequest(true)
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de récupérer les inscriptions')
  }
  return (await response.json()) as AccountRegistrationsResponse
}

export const useAccountRegistrations = () =>
  useQuery<AccountRegistrationsResponse, Error>({
    queryKey: ACCOUNT_REGISTRATIONS_QUERY_KEY,
    queryFn: fetchAccountRegistrations,
    staleTime: 2 * 60 * 1000,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false
      const message = error.message.toLowerCase()
      if (message.includes('non authentifi')) return false
      return true
    },
  })
