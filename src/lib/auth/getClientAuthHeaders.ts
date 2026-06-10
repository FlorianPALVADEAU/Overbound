import { createSupabaseBrowser } from '@/lib/supabase/client'

type ClientAuthHeadersOptions = {
  forceRefresh?: boolean
}

export const getClientAuthHeaders = async (
  options: ClientAuthHeadersOptions = {},
): Promise<Record<string, string>> => {
  const supabase = createSupabaseBrowser()

  const { forceRefresh = false } = options

  if (forceRefresh) {
    await supabase.auth.refreshSession()
  }

  let {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    await supabase.auth.refreshSession()
    ;({
      data: { session },
    } = await supabase.auth.getSession())
  }

  const accessToken = session?.access_token
  if (!accessToken) {
    return {}
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  }
}
