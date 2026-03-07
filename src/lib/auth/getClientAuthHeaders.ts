import { createSupabaseBrowser } from '@/lib/supabase/client'

const TOKEN_REFRESH_SAFETY_WINDOW_SECONDS = 60

const getAccessTokenFromStorage = (): string | null => {
  if (typeof window === 'undefined') return null

  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (!key || !key.endsWith('-auth-token')) continue

      const raw = window.localStorage.getItem(key)
      if (!raw) continue

      const parsed = JSON.parse(raw) as
        | { access_token?: string; currentSession?: { access_token?: string } }
        | null
      const token = parsed?.access_token ?? parsed?.currentSession?.access_token ?? null
      if (typeof token === 'string' && token.length > 0) {
        return token
      }
    }
  } catch (error) {
    console.warn('[auth headers] localStorage token read failed', error)
  }

  return null
}

export const getClientAuthHeaders = async (): Promise<Record<string, string>> => {
  const supabase = createSupabaseBrowser()

  let {
    data: { session },
  } = await supabase.auth.getSession()

  const expiresAt = session?.expires_at ?? null
  const isNearExpiry =
    typeof expiresAt === 'number' &&
    expiresAt <= Math.floor(Date.now() / 1000) + TOKEN_REFRESH_SAFETY_WINDOW_SECONDS

  if (!session || isNearExpiry) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    session = refreshed.session ?? session ?? null
  }

  let accessToken = session?.access_token ?? null
  if (!accessToken) {
    accessToken = getAccessTokenFromStorage()
  }

  const headers: Record<string, string> = {}
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return headers
}
