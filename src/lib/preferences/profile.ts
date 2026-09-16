import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export type MarketingPreferencesProfile = {
  id: string
  full_name: string | null
  marketing_opt_in: boolean | null
}

/**
 * Fetch the minimal profile fields needed to render the marketing
 * preferences page (id, display name, marketing opt-in flag).
 */
export async function getMarketingPreferencesProfile(
  supabase: SupabaseServerClient,
  userId: string
): Promise<MarketingPreferencesProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, marketing_opt_in')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data as MarketingPreferencesProfile
}
