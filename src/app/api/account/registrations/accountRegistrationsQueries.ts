import { useQuery } from '@tanstack/react-query'
import type { SessionProfile, SessionUser } from '@/app/api/session/sessionQueries'
import type { AccountRegistrationItem } from '@/components/account/AccountRegistrationsList'
import { getClientAuthHeaders } from '@/lib/auth/getClientAuthHeaders'
import { createSupabaseBrowser } from '@/lib/supabase/client'

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

const buildFallbackAccountResponse = (session: { user: any } | null): AccountRegistrationsResponse | null => {
  if (!session?.user) return null
  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
      created_at: session.user.created_at ?? null,
      user_metadata: {
        full_name: session.user.user_metadata?.full_name,
        avatar_url: session.user.user_metadata?.avatar_url,
      },
    },
    profile: {
      full_name: session.user.user_metadata?.full_name ?? null,
      avatar_url: session.user.user_metadata?.avatar_url ?? null,
      phone: null,
      date_of_birth: null,
      marketing_opt_in: null,
      role: null,
    },
    stats: {
      totalEvents: 0,
      checkedInEvents: 0,
      upcomingEvents: 0,
    },
    registrations: [],
  }
}

const fetchAccountRegistrations = async (): Promise<AccountRegistrationsResponse> => {
  const supabase = createSupabaseBrowser()
  const {
    data: { session: localSession },
  } = await supabase.auth.getSession()

  const headers = await getClientAuthHeaders()

  const response = await fetch('/api/account/registrations', { 
    cache: 'no-store',
    headers,
    credentials: 'include', // Ensure cookies are sent with the request
  })
  if (!response.ok) {
    if ([401, 429, 500, 502, 503, 504].includes(response.status)) {
      const fallback = buildFallbackAccountResponse(localSession)
      if (fallback) {
        return fallback
      }
    }
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
