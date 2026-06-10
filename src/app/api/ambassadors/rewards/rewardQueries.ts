'use client'

import type { AmbassadorReward } from '@/types/Ambassador'

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
