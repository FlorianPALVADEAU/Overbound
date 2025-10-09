import { useQuery } from '@tanstack/react-query'
import type { SessionProfile, SessionUser } from '@/app/api/session/sessionQueries'
import type { AccountRegistrationItem } from '@/components/account/AccountRegistrationsList'

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
  const response = await fetch('/api/account/registrations', { cache: 'no-store' })
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
    staleTime: 60 * 1000,
  })
