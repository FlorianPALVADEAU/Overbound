import type { PricingSupabase } from './supabaseClient'

/** Active registrations already seated on each price tier of the event, by tier id. */
export const fetchTierRegistrationCounts = async (
  supabase: PricingSupabase,
  eventId: string,
): Promise<Record<string, number>> => {
  const { data, error } = await supabase
    .from('registrations')
    .select('event_price_tier_id')
    .eq('event_id', eventId)
    .is('cancelled_at', null)
  if (error) throw error

  const counts: Record<string, number> = {}
  for (const row of (data ?? []) as Array<{ event_price_tier_id: string | null }>) {
    if (row.event_price_tier_id) counts[row.event_price_tier_id] = (counts[row.event_price_tier_id] ?? 0) + 1
  }
  return counts
}
