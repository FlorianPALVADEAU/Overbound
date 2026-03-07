import { createSupabaseBrowser } from '@/lib/supabase/client'

const TOKEN_REFRESH_SAFETY_WINDOW_SECONDS = 60

export const getClientAuthHeaders = async (): Promise<HeadersInit> => {
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

  const headers: HeadersInit = {}
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }

  return headers
}
