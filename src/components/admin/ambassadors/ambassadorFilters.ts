import type { AdminAmbassadorPointsRow, AdminAmbassadorReward } from '@/app/api/admin/ambassadors/ambassadorsQueries'
import type { AmbassadorRewardStatus } from '@/types/Ambassador'

const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

const matches = (term: string, values: ReadonlyArray<string | null | undefined>) => {
  const needle = normalize(term.trim())
  if (!needle) return true
  return values.some((value) => value && normalize(value).includes(needle))
}

/** Ranking rows matching the search (name or promo code), accents and case ignored. */
export const filterAmbassadorRows = (rows: readonly AdminAmbassadorPointsRow[], term: string) =>
  rows.filter((row) => matches(term, [row.ambassador_name, row.ambassador_code]))

/** Rewards matching the search (ambassador, code, reward name) and, when set, one status. */
export const filterRewards = (rewards: readonly AdminAmbassadorReward[], term: string, status: AmbassadorRewardStatus | null) =>
  rewards.filter(
    (reward) => (status === null || reward.status === status) && matches(term, [reward.ambassador_name, reward.ambassador_code, reward.reward_name]),
  )
