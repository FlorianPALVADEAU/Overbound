import { useCallback, useState } from 'react'
import { claimAmbassadorReward } from '@/lib/ambassadors/rewardsClient'

export function useClaimAmbassadorReward(onClaimed?: () => void | Promise<void>) {
  const [claimingLevel, setClaimingLevel] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const handleClaimReward = useCallback(
    async (rewardLevel: number) => {
      setClaimingLevel(rewardLevel)
      setActionError(null)
      setActionSuccess(null)
      try {
        await claimAmbassadorReward(rewardLevel)
        setActionSuccess('Récompense réclamée ! L’équipe Overbound va te contacter.')
        await onClaimed?.()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Impossible de réclamer.')
      } finally {
        setClaimingLevel(null)
      }
    },
    [onClaimed],
  )

  return { claimingLevel, actionError, actionSuccess, handleClaimReward }
}
