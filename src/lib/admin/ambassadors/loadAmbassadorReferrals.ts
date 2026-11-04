import type { SupabaseClient } from '@supabase/supabase-js'
import { loadAmbassadorCodes, loadAmbassadorRecruits } from '@/lib/ambassadors/dashboard/loadAmbassadorDashboard'
import { loadCurrentSeason } from '@/lib/ambassadors/season'
import type { AdminAmbassadorReferralRow } from './types'

type Admin = Pick<SupabaseClient, 'from'>

/**
 * Referrals of the running season, with the same rules as the ambassador's own dashboard: code, affiliation
 * token or manual credit. Null when the ambassador does not exist.
 */
export async function loadAmbassadorReferrals(admin: Admin, ambassadorId: string): Promise<AdminAmbassadorReferralRow[] | null> {
  const { data: ambassador, error } = await admin
    .from('ambassadors')
    .select('id, promotional_code_id')
    .eq('id', ambassadorId)
    .maybeSingle()
  if (error) throw new Error(`[admin ambassador referrals] ambassador: ${error.message}`)
  if (!ambassador) return null

  const season = await loadCurrentSeason(admin)
  const codes = await loadAmbassadorCodes(admin, { id: ambassador.id, promotional_code_id: ambassador.promotional_code_id })
  return loadAmbassadorRecruits(admin, { id: ambassador.id, promotional_code_id: ambassador.promotional_code_id }, codes, season.startedAt)
}
