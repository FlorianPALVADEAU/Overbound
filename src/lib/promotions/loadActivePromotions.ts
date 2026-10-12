import { supabaseAdmin } from '@/lib/supabase/server'
import type { Promotion } from '@/types/Promotion'

/**
 * Server-side read of the promotions running now (banners and popups).
 * Shared by `/api/promotions` and the root layout, which renders the banner
 * into the HTML instead of inserting it after a client fetch (layout shift).
 * Throws on a database error.
 */
export async function loadActivePromotions(): Promise<Promotion[]> {
  const nowIso = new Date().toISOString()

  const { data, error } = await supabaseAdmin()
    .from('site_promotions')
    .select('*')
    .eq('is_active', true)
    .lte('starts_at', nowIso)
    .gte('ends_at', nowIso)
    .order('starts_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Promotion[]
}
