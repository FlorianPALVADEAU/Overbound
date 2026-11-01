import type { SupabaseClient } from '@supabase/supabase-js'
import type { AmbassadorProgramRules } from '@/types/Ambassador'
import { buildProgramRules, type ProgramRulesRow, type RewardLevelRow } from '@/lib/ambassadors/program'

type Admin = Pick<SupabaseClient, 'from'>

/** Reads the reward ladder and bonus rule in force for a program year. The database is the only source. */
export async function loadProgramRules(admin: Admin, programYear: number): Promise<AmbassadorProgramRules> {
  const [levels, rules] = await Promise.all([
    admin
      .from('ambassador_reward_levels')
      .select('effective_year, reward_level, points_required, reward_name, description, badge_label, kind')
      .lte('effective_year', programYear),
    admin
      .from('ambassador_program_rules')
      .select('effective_year, bonus_base_points, bonus_interval_points, bonus_reward_name')
      .lte('effective_year', programYear),
  ])

  if (levels.error) throw levels.error
  if (rules.error) throw rules.error

  const ruleRows: ProgramRulesRow[] = (rules.data ?? []).map((row) => ({
    effective_year: row.effective_year,
    base_points: row.bonus_base_points,
    interval_points: row.bonus_interval_points,
    reward_name: row.bonus_reward_name,
  }))

  return buildProgramRules((levels.data ?? []) as RewardLevelRow[], ruleRows, programYear)
}
