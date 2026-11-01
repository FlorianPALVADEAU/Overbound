import type { SupabaseClient } from '@supabase/supabase-js'

type Admin = Pick<SupabaseClient, 'from'>

export interface AmbassadorSeason {
  /** Value of `program_year` on every point and reward of the running season. Not a calendar year. */
  season: number
  /** Orders created before this instant never earn points. */
  startedAt: string
  /** Rewards of the season expire at this instant. Null: no expiry until the team sets one. */
  endsAt: string | null
}

/** The running season, read from the single row of `ambassador_program_season`. */
export async function loadCurrentSeason(admin: Admin): Promise<AmbassadorSeason> {
  const { data, error } = await admin
    .from('ambassador_program_season')
    .select('current_season, started_at, ends_at')
    .eq('singleton', true)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('[ambassador season] ambassador_program_season is empty: apply the season migration')
  return { season: Number(data.current_season), startedAt: String(data.started_at), endsAt: data.ends_at ? String(data.ends_at) : null }
}
