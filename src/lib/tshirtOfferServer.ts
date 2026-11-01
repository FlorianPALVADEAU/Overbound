import type { SupabaseClient } from '@supabase/supabase-js'
import { buildTshirtOffer, parseTshirtQuota, type TshirtOffer } from '@/lib/tshirtOffer'

interface OfferEvent {
  id: string
  tshirt_offer_quota?: number | null
}

/**
 * Registrations that count toward the offer: active, and not a companion bib
 * (it is the same person as their RANKED bib, already counted).
 */
const participants = (supabase: SupabaseClient, eventId: string) =>
  supabase.from('registrations').select('id', { count: 'exact' }).eq('event_id', eventId).is('cancelled_at', null).is('companion_of', null)

/** Offer state of an event, or null when it has none. Throws on a database error. */
export const loadTshirtOffer = async (supabase: SupabaseClient, event: OfferEvent): Promise<TshirtOffer | null> => {
  if (parseTshirtQuota(event.tshirt_offer_quota) === null) return null
  const { count, error } = await participants(supabase, event.id).limit(0)
  if (error) throw error
  return buildTshirtOffer(event.tshirt_offer_quota, count ?? 0)
}

/** Ids of the first `quota` registrations by creation order: the ones that get the T-shirt. */
export const loadTshirtWinnerIds = async (supabase: SupabaseClient, event: OfferEvent): Promise<Set<string>> => {
  const quota = parseTshirtQuota(event.tshirt_offer_quota)
  if (quota === null) return new Set()
  const { data, error } = await participants(supabase, event.id)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(quota)
  if (error) throw error
  return new Set((data ?? []).map((row) => row.id as string))
}

/** How many of these registrations get the free T-shirt. 0 on any failure or when the event has no offer. */
export const countOrderTshirtWinners = async (
  supabase: SupabaseClient,
  eventId: string,
  registrationIds: string[],
): Promise<number> => {
  try {
    const { data } = await supabase.from('events').select('id, tshirt_offer_quota').eq('id', eventId).maybeSingle()
    if (!data) return 0
    const winners = await loadTshirtWinnerIds(supabase, data)
    return registrationIds.filter((id) => winners.has(id)).length
  } catch (error) {
    console.error('[tshirt-offer] winners lookup failed', error)
    return 0
  }
}
