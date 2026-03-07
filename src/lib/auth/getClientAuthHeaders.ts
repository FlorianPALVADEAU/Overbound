import { createSupabaseBrowser } from '@/lib/supabase/client'
import { readMirroredSession } from '@/lib/auth/clientSessionMirror'

type StoredAuthTokens = {
  accessToken: string | null
  refreshToken: string | null
}

const getSupabaseProjectRef = (): string | null => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null

  try {
    const host = new URL(supabaseUrl).hostname
    const projectRef = host.split('.')[0]
    return projectRef || null
  } catch {
    return null
  }
}

const decodeBase64 = (value: string): string | null => {
  try {
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      return window.atob(value)
    }
    return null
  } catch {
    return null
  }
}

const parseTokenContainer = (raw: string): StoredAuthTokens => {
  const normalized = raw.startsWith('base64-') ? raw.slice('base64-'.length) : raw
  const decoded = raw.startsWith('base64-') ? decodeBase64(normalized) : normalized
  const source = decoded ?? normalized

  try {
    const parsed = JSON.parse(source) as
      | {
          access_token?: string
          refresh_token?: string
          currentSession?: { access_token?: string; refresh_token?: string }
        }
      | [string, string]
      | null

    if (Array.isArray(parsed)) {
      return {
        accessToken: typeof parsed[0] === 'string' ? parsed[0] : null,
        refreshToken: typeof parsed[1] === 'string' ? parsed[1] : null,
      }
    }

    const accessToken = parsed?.access_token ?? parsed?.currentSession?.access_token ?? null
    const refreshToken = parsed?.refresh_token ?? parsed?.currentSession?.refresh_token ?? null
    return {
      accessToken: typeof accessToken === 'string' ? accessToken : null,
      refreshToken: typeof refreshToken === 'string' ? refreshToken : null,
    }
  } catch {
    return {
      accessToken: null,
      refreshToken: null,
    }
  }
}

const mergeTokenCandidate = (current: StoredAuthTokens, candidate: StoredAuthTokens): StoredAuthTokens => ({
  accessToken: current.accessToken ?? candidate.accessToken,
  refreshToken: current.refreshToken ?? candidate.refreshToken,
})

const getTokensFromStorage = (): StoredAuthTokens => {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null }
  }

  let tokens: StoredAuthTokens = { accessToken: null, refreshToken: null }
  const projectRef = getSupabaseProjectRef()
  const preferredStorageKey = projectRef ? `sb-${projectRef}-auth-token` : null

  try {
    if (preferredStorageKey) {
      const rawPreferred = window.localStorage.getItem(preferredStorageKey)
      if (rawPreferred) {
        const preferredCandidate = parseTokenContainer(rawPreferred)
        tokens = mergeTokenCandidate(tokens, preferredCandidate)
        if (tokens.accessToken && tokens.refreshToken) {
          return tokens
        }
      }
    }

    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (!key || !key.includes('auth-token')) continue
      if (preferredStorageKey && key !== preferredStorageKey) continue
      const raw = window.localStorage.getItem(key)
      if (!raw) continue

      const candidate = parseTokenContainer(raw)
      tokens = mergeTokenCandidate(tokens, candidate)
      if (tokens.accessToken && tokens.refreshToken) {
        return tokens
      }
    }
  } catch (error) {
    console.warn('[auth headers] localStorage token read failed', error)
  }

  try {
    const cookies = document.cookie
      .split(';')
      .map((value) => value.trim())
      .filter(Boolean)

    for (const cookie of cookies) {
      const separatorIndex = cookie.indexOf('=')
      if (separatorIndex <= 0) continue

      const key = decodeURIComponent(cookie.slice(0, separatorIndex))
      if (!key.includes('auth-token')) continue
      if (projectRef && !key.includes(`sb-${projectRef}-auth-token`)) continue

      const value = decodeURIComponent(cookie.slice(separatorIndex + 1))
      const candidate = parseTokenContainer(value)
      tokens = mergeTokenCandidate(tokens, candidate)
      if (tokens.accessToken && tokens.refreshToken) {
        return tokens
      }
    }
  } catch (error) {
    console.warn('[auth headers] cookie token read failed', error)
  }

  return tokens
}

const getClientSession = async () => {
  const supabase = createSupabaseBrowser()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session ?? null
}

export const getClientAuthHeaders = async (): Promise<Record<string, string>> => {
  const mirrored = readMirroredSession()
  const mirroredIsFresh =
    mirrored?.expiresAt == null ||
    mirrored.expiresAt > Math.floor(Date.now() / 1000) + 30

  if (mirrored?.accessToken && mirroredIsFresh) {
    return {
      Authorization: `Bearer ${mirrored.accessToken}`,
    }
  }

  const session = await getClientSession()
  const fallbackTokens = session ? null : getTokensFromStorage()
  const accessToken = session?.access_token ?? fallbackTokens?.accessToken ?? null

  const headers: Record<string, string> = {}
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return headers
}
