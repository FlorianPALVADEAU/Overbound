import { createSupabaseBrowser } from '@/lib/supabase/client'

export const getClientAuthHeaders = async (): Promise<Record<string, string>> => {
  const supabase = createSupabaseBrowser()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const accessToken = session?.access_token
  if (!accessToken) {
    return {}
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  }
}
