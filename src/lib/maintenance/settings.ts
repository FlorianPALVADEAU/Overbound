import type { SupabaseClient } from '@supabase/supabase-js'
import type { MaintenanceSettings } from './policy'

const CACHE_TTL_MS = 5_000

let cache: { value: MaintenanceSettings; expiresAt: number } | null = null

const OFF: MaintenanceSettings = { enabled: false, message: null, estimated_end: null }

/**
 * Reads the maintenance row. Fails open (maintenance off) when the table is missing or unreachable:
 * a broken flag must never take the whole site down. Cached a few seconds per runtime instance,
 * so a toggle takes effect within ~5 s.
 */
export async function readMaintenanceSettings(supabase: SupabaseClient, { fresh = false } = {}): Promise<MaintenanceSettings> {
  const now = Date.now()
  if (!fresh && cache && cache.expiresAt > now) return cache.value

  const { data, error } = await supabase
    .from('site_maintenance')
    .select('enabled, message, estimated_end')
    .eq('id', true)
    .maybeSingle()

  if (error) console.error('[maintenance] read failed, failing open', error.message)
  const value = error || !data ? OFF : (data as MaintenanceSettings)
  cache = { value, expiresAt: now + CACHE_TTL_MS }
  return value
}

export const resetMaintenanceCache = () => {
  cache = null
}
