export interface RewardStatusRow {
  ambassador_id: string
  status: string
}

export interface RewardsToHandle {
  toClaim: number
  toFulfil: number
}

/**
 * Open reward work per ambassador. An earned reward waits for its ambassador to claim it; a claimed
 * reward waits for the team to send it. Other statuses need no action and are not counted.
 */
export function countRewardsToHandle(rows: readonly RewardStatusRow[]): Map<string, RewardsToHandle> {
  const counts = new Map<string, RewardsToHandle>()
  for (const row of rows) {
    if (row.status !== 'earned' && row.status !== 'claimed') continue
    const current = counts.get(row.ambassador_id) ?? { toClaim: 0, toFulfil: 0 }
    if (row.status === 'earned') current.toClaim += 1
    else current.toFulfil += 1
    counts.set(row.ambassador_id, current)
  }
  return counts
}
