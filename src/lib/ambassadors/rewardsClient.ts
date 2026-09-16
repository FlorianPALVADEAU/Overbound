'use client'

import type { AmbassadorReward } from '@/types/Ambassador'

/**
 * Claims an ambassador reward via the API route. This is a thin client-side
 * fetch wrapper — it intentionally lives in `src/lib/ambassadors/` (not under
 * `src/app/api/`) so UI components depend on the domain library layer rather
 * than reaching into the route-handler tree.
 */
export const claimAmbassadorReward = async (rewardLevel: number): Promise<AmbassadorReward> => {
  const response = await fetch('/api/ambassadors/rewards/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reward_level: rewardLevel }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de réclamer la récompense.')
  }

  const payload = (await response.json()) as { reward: AmbassadorReward }
  return payload.reward
}
