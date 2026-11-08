import type { SupabaseClient } from '@supabase/supabase-js'
import { sendAmbassadorPointsNudgeEmail } from '@/lib/ambassadors/email'
import { buildGoal, type AmbassadorGoal } from '@/lib/ambassadors/dashboard/goal'
import { loadProgramRules } from '@/lib/ambassadors/programRules'
import { loadCurrentSeason } from '@/lib/ambassadors/season'
import type { AmbassadorProgramRules } from '@/types/Ambassador'

type NudgeClient = Pick<SupabaseClient, 'from' | 'auth'>

/** An ambassador this close to a goal gets one email. Further away it is noise, closer it is already done. */
export const NUDGE_MAX_POINTS_REMAINING = 2

/** The goal worth nudging about, or null when the ambassador is not close enough. */
export function getNudgeGoal(program: AmbassadorProgramRules, totalPoints: number): AmbassadorGoal | null {
  const goal = buildGoal(program, totalPoints)
  return goal && goal.pointsRemaining > 0 && goal.pointsRemaining <= NUDGE_MAX_POINTS_REMAINING ? goal : null
}

/**
 * Emails an ambassador who just came within a few points of their next goal. Once per goal and
 * season: the row is claimed before sending and released if the email fails, so a retry can resend.
 */
export async function nudgeAmbassadorNearGoal(admin: NudgeClient, ambassadorId: string): Promise<void> {
  const { season } = await loadCurrentSeason(admin)

  const [{ data: ambassador }, { data: points }] = await Promise.all([
    admin.from('ambassadors').select('id, profile_id').eq('id', ambassadorId).eq('is_active', true).maybeSingle(),
    admin.from('ambassador_points_years').select('total_points').eq('ambassador_id', ambassadorId).eq('program_year', season).maybeSingle(),
  ])
  if (!ambassador?.profile_id) return

  const program = await loadProgramRules(admin, season)
  const goal = getNudgeGoal(program, Number(points?.total_points ?? 0))
  if (!goal) return

  const { data: claimed, error: claimError } = await admin
    .from('ambassador_nudges')
    .upsert({ ambassador_id: ambassadorId, season, points_required: goal.pointsRequired }, { onConflict: 'ambassador_id,season,points_required', ignoreDuplicates: true })
    .select('points_required')
  if (claimError) throw claimError
  if (!claimed || claimed.length === 0) return

  const release = () =>
    admin.from('ambassador_nudges').delete().eq('ambassador_id', ambassadorId).eq('season', season).eq('points_required', goal.pointsRequired)

  try {
    const [{ data: profile }, { data: authUser }, { data: codeRow }] = await Promise.all([
      admin.from('profiles').select('first_name').eq('id', ambassador.profile_id).maybeSingle(),
      admin.auth.admin.getUserById(ambassador.profile_id),
      admin.from('ambassador_promotional_codes').select('promotional_code:promotional_codes(code)').eq('ambassador_id', ambassadorId).eq('is_current', true).maybeSingle(),
    ])
    const email = authUser?.user?.email
    if (!email) {
      await release()
      return
    }
    const promotionalCode = Array.isArray(codeRow?.promotional_code) ? codeRow?.promotional_code[0] : codeRow?.promotional_code

    await sendAmbassadorPointsNudgeEmail({
      to: email,
      firstName: profile?.first_name ?? null,
      ambassadorCode: promotionalCode?.code ?? null,
      goalName: goal.name,
      pointsRemaining: goal.pointsRemaining,
    })
  } catch (error) {
    await release()
    throw error
  }
}
