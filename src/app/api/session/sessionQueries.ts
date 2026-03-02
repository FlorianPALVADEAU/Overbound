import { useQuery } from '@tanstack/react-query'

export interface SessionProfile {
  full_name?: string | null
  avatar_url?: string | null
  phone?: string | null
  date_of_birth?: string | null
  marketing_opt_in?: boolean | null
  role?: string | null
}

export interface SessionUser {
  id: string
  email?: string | null
  created_at?: string | null
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export interface SessionResponse {
  user: SessionUser | null
  profile: SessionProfile | null
  alerts?: {
    needs_document_action?: boolean
  } | null
}

export const SESSION_QUERY_KEY = ['session'] as const

const fetchSession = async (): Promise<SessionResponse> => {
  const response = await fetch('/api/session', { 
    cache: 'no-store',
    credentials: 'include', // Ensure cookies are sent with the request
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de récupérer la session utilisateur')
  }
  return (await response.json()) as SessionResponse
}

export const useSession = () =>
  useQuery<SessionResponse, Error>({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: (query) => (query.state.data?.user ? false : 2000),
    refetchIntervalInBackground: true,
  })
