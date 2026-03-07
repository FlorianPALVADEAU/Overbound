import { createSupabaseBrowser } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'

const TOKEN_REFRESH_SAFETY_WINDOW_SECONDS = 60

type StoredAuthTokens = {
  accessToken: string | null
  refreshToken: string | null
}

const getTokensFromStorage = (): StoredAuthTokens => {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null }
  }

  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (!key || !key.endsWith('-auth-token')) continue

      const raw = window.localStorage.getItem(key)
      if (!raw) continue

      const parsed = JSON.parse(raw) as
        | {
            access_token?: string
            refresh_token?: string
            currentSession?: { access_token?: string; refresh_token?: string }
          }
        | null
      const accessToken = parsed?.access_token ?? parsed?.currentSession?.access_token ?? null
      const refreshToken = parsed?.refresh_token ?? parsed?.currentSession?.refresh_token ?? null

      if (typeof accessToken === 'string' && accessToken.length > 0) {
        return {
          accessToken,
          refreshToken: typeof refreshToken === 'string' && refreshToken.length > 0 ? refreshToken : null,
        }
      }
    }
  } catch (error) {
    console.warn('[auth headers] localStorage token read failed', error)
  }

  return {
    accessToken: null,
    refreshToken: null,
  }
}

export const ensureClientSession = async (): Promise<Session | null> => {
  const supabase = createSupabaseBrowser()

  let {
    data: { session },
  } = await supabase.auth.getSession()

  const expiresAt = session?.expires_at ?? null
  const isNearExpiry =
    typeof expiresAt === 'number' &&
    expiresAt <= Math.floor(Date.now() / 1000) + TOKEN_REFRESH_SAFETY_WINDOW_SECONDS

  // Important: never call refreshSession() when session is missing.
  // It can trigger an auth reset flow on some clients right after login.
  if (session && isNearExpiry) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    session = refreshed.session ?? session
  }

  if (!session) {
    const storedTokens = getTokensFromStorage()
    if (storedTokens.accessToken && storedTokens.refreshToken) {
      const { data: restored } = await supabase.auth.setSession({
        access_token: storedTokens.accessToken,
        refresh_token: storedTokens.refreshToken,
      })
      session = restored.session ?? null
    }
  }

  return session ?? null
}

export const getClientAuthHeaders = async (): Promise<Record<string, string>> => {
  const session = await ensureClientSession()
  const fallbackTokens = session ? null : getTokensFromStorage()
  const accessToken = session?.access_token ?? fallbackTokens?.accessToken ?? null

  const headers: Record<string, string> = {}
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return headers
}
