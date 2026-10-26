import { supabaseAdmin } from '@/lib/supabase/server'
import { selectLastEvent } from '@/lib/events/featuredEvent'

export type LastEvent = {
  id: string
  slug: string
  title: string
  date: string
  location: string
  status: string
  photos_url: string | null
}

/**
 * Most recent event that is neither a draft nor cancelled, for the events hub
 * when no edition is open. Public fields only. Throws on a database error.
 */
export async function loadLastEvent(): Promise<LastEvent | null> {
  const { data, error } = await supabaseAdmin()
    .from('events')
    .select('id, slug, title, date, location, status, photos_url')
  if (error) throw new Error(error.message)

  return selectLastEvent((data ?? []).filter((event) => event.slug)) as LastEvent | null
}
