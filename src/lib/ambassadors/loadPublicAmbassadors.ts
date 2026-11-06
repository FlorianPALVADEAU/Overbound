import type { SupabaseClient } from '@supabase/supabase-js'
import { loadAmbassadorCodes } from '@/lib/ambassadors/dashboard/loadAmbassadorDashboard'
import { publicPhotoUrl, toPublicName } from '@/lib/ambassadors/publicProfile'
import { loadGroupsByProfile, type PublicGroup } from '@/lib/ambassadors/publicGroup'
import { loadCurrentSeason } from '@/lib/ambassadors/season'

type Admin = Pick<SupabaseClient, 'from'>

export interface PublicAmbassador {
  id: string
  name: string
  photo_url: string | null
  /** Friends who joined with this ambassador's code this season. Zero is not shown. */
  recruits: number
  /** Code applied by the `/?ref=` link. Null when the ambassador has none. */
  code: string | null
  /** One short sentence written by the ambassador. */
  bio: string | null
  /** Shown only when the ambassador agreed to it: joining the group is a public link. */
  group: PublicGroup | null
}

function ensure<T>(step: string, result: { data: T[] | null; error: { message: string } | null }): T[] {
  if (result.error) throw new Error(`[public ambassadors] ${step}: ${result.error.message}`)
  return result.data ?? []
}

/**
 * The ambassadors shown on `/ambassadors`: active, opted in, not hidden by the team. Most recruits first,
 * then alphabetical. No points and no tier leave this function: the page shows people, not a scoreboard.
 */
export async function loadPublicAmbassadors(admin: Admin): Promise<PublicAmbassador[]> {
  const ambassadors = ensure<{
    id: string
    profile_id: string
    promotional_code_id: string | null
    public_bio: string | null
    public_show_group: boolean
  }>(
    'ambassadors',
    await admin
      .from('ambassadors')
      .select('id, profile_id, promotional_code_id, public_bio, public_show_group')
      .eq('is_active', true)
      .eq('public_opt_in', true)
      .eq('public_blocked', false),
  )
  if (ambassadors.length === 0) return []

  const { season } = await loadCurrentSeason(admin)
  const [profiles, points, codes, groups] = await Promise.all([
    admin.from('profiles').select('id, full_name, avatar_url').in('id', ambassadors.map((row) => row.profile_id)),
    admin.from('ambassador_points_years').select('ambassador_id, recruits_open, recruits_ranked').eq('program_year', season).in('ambassador_id', ambassadors.map((row) => row.id)),
    Promise.all(ambassadors.map((row) => loadAmbassadorCodes(admin, { id: row.id, promotional_code_id: row.promotional_code_id }))),
    loadGroupsByProfile(admin, ambassadors.filter((row) => row.public_show_group).map((row) => row.profile_id)),
  ])

  const profileById = new Map(ensure<{ id: string; full_name: string | null; avatar_url: string | null }>('profiles', profiles).map((row) => [row.id, row]))
  const recruitsById = new Map(
    ensure<{ ambassador_id: string; recruits_open: number; recruits_ranked: number }>('points', points).map((row) => [
      row.ambassador_id,
      (row.recruits_open ?? 0) + (row.recruits_ranked ?? 0),
    ]),
  )

  return ambassadors
    .map((row, index): PublicAmbassador => {
      const profile = profileById.get(row.profile_id)
      return {
        id: row.id,
        name: toPublicName(profile?.full_name),
        photo_url: publicPhotoUrl(profile?.avatar_url),
        recruits: recruitsById.get(row.id) ?? 0,
        code: codes[index].currentCode,
        bio: row.public_bio,
        group: row.public_show_group ? (groups.get(row.profile_id) ?? null) : null,
      }
    })
    .sort((a, b) => b.recruits - a.recruits || a.name.localeCompare(b.name, 'fr'))
}
