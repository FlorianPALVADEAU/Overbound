import { useQuery } from '@tanstack/react-query'
import { getClientAuthHeaders } from '@/lib/auth/getClientAuthHeaders'
import { createSupabaseBrowser } from '@/lib/supabase/client'

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

const mapSessionUser = (sessionUser: {
  id: string
  email?: string | null
  created_at?: string | null
  user_metadata?: Record<string, any> | null
}): SessionUser => ({
  id: sessionUser.id,
  email: sessionUser.email ?? null,
  created_at: sessionUser.created_at ?? null,
  user_metadata: {
    full_name: sessionUser.user_metadata?.full_name,
    avatar_url: sessionUser.user_metadata?.avatar_url,
  },
})

const buildFallbackFromLocalSession = (session: { user: any } | null): SessionResponse | null => {
  if (!session?.user) return null
  return {
    user: mapSessionUser(session.user),
    profile: {
      full_name: session.user.user_metadata?.full_name ?? null,
      avatar_url: session.user.user_metadata?.avatar_url ?? null,
      phone: null,
      date_of_birth: null,
      marketing_opt_in: null,
      role: null,
    },
    alerts: null,
  }
}

const fetchSession = async (): Promise<SessionResponse> => {
  const supabase = createSupabaseBrowser()
  const {
    data: { session: localSession },
  } = await supabase.auth.getSession()

  const headers = await getClientAuthHeaders()

  const response = await fetch('/api/session', {
    cache: 'no-store',
    headers,
    credentials: 'include', // Ensure cookies are sent with the request
  })
  if (!response.ok) {
    if ([401, 429, 500, 502, 503, 504].includes(response.status)) {
      const fallback = buildFallbackFromLocalSession(localSession)
      if (fallback) {
        return fallback
      }
    }
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de récupérer la session utilisateur')
  }
  const payload = (await response.json()) as SessionResponse
  if (!payload.user) {
    const fallback = buildFallbackFromLocalSession(localSession)
    if (fallback) {
      return {
        ...payload,
        user: fallback.user,
        profile: payload.profile ?? fallback.profile,
      }
    }
  }

  return payload
}

export const useSession = () =>
  useQuery<SessionResponse, Error>({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false
      const message = error.message.toLowerCase()
      if (message.includes('non authentifi')) return false
      return true
    },
  })
