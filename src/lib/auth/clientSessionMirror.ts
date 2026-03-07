import type { Session } from '@supabase/supabase-js'

const MIRROR_STORAGE_KEY = 'overbound-auth-session'
const EXPLICIT_SIGNOUT_KEY = 'overbound-explicit-signout'

type MirroredSession = {
  accessToken: string
  refreshToken: string | null
  expiresAt: number | null
}

export const writeMirroredSession = (session: Session | null) => {
  if (typeof window === 'undefined') return

  if (!session?.access_token) {
    window.localStorage.removeItem(MIRROR_STORAGE_KEY)
    return
  }

  const payload: MirroredSession = {
    accessToken: session.access_token,
    refreshToken: session.refresh_token ?? null,
    expiresAt: session.expires_at ?? null,
  }

  window.localStorage.setItem(MIRROR_STORAGE_KEY, JSON.stringify(payload))
}

export const readMirroredSession = (): MirroredSession | null => {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(MIRROR_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<MirroredSession>
    if (!parsed.accessToken || typeof parsed.accessToken !== 'string') {
      return null
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : null,
      expiresAt: typeof parsed.expiresAt === 'number' ? parsed.expiresAt : null,
    }
  } catch {
    return null
  }
}

export const clearMirroredSession = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(MIRROR_STORAGE_KEY)
}

export const isMirroredSessionExpired = (session: MirroredSession | null, safetySeconds = 0): boolean => {
  if (!session?.accessToken) return true
  if (typeof session.expiresAt !== 'number') return false
  return session.expiresAt <= Math.floor(Date.now() / 1000) + Math.max(0, safetySeconds)
}

export const markExplicitSignOut = () => {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(EXPLICIT_SIGNOUT_KEY, '1')
}

export const consumeExplicitSignOutMarker = (): boolean => {
  if (typeof window === 'undefined') return false
  const marked = window.sessionStorage.getItem(EXPLICIT_SIGNOUT_KEY) === '1'
  if (marked) {
    window.sessionStorage.removeItem(EXPLICIT_SIGNOUT_KEY)
  }
  return marked
}
