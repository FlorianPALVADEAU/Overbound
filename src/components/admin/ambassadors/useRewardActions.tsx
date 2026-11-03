'use client'

import { useState, type ReactNode } from 'react'
import { useTransitionAmbassadorReward, useUpdateAmbassadorReward } from '@/app/api/admin/ambassadors/ambassadorsQueries'
import type { AmbassadorRewardStatus } from '@/types/Ambassador'
import { RewardReasonDialog } from './RewardReasonDialog'
import { mutationMessage, REWARD_STATUS_LABELS } from './rewardStatus'

export interface RewardActionNotice {
  tone: 'success' | 'error'
  text: string
}

type Transition = 'cancelled' | 'reopened'

/**
 * What an admin can do to a reward, shared by the rewards list and the ambassador sheet: set a status, or
 * cancel / reopen with a reason. `dialog` must be rendered by the caller; `notice` carries the outcome.
 */
export function useRewardActions(): {
  setStatus: (rewardId: string, status: AmbassadorRewardStatus) => Promise<void>
  askTransition: (rewardId: string, action: Transition) => void
  pending: boolean
  notice: RewardActionNotice | null
  clearNotice: () => void
  dialog: ReactNode
} {
  const updateReward = useUpdateAmbassadorReward()
  const transitionReward = useTransitionAmbassadorReward()
  const [notice, setNotice] = useState<RewardActionNotice | null>(null)
  const [asking, setAsking] = useState<{ rewardId: string; action: Transition } | null>(null)

  const setStatus = async (rewardId: string, status: AmbassadorRewardStatus) => {
    try {
      await updateReward.mutateAsync({ id: rewardId, status })
      setNotice({ tone: 'success', text: `Récompense marquée « ${REWARD_STATUS_LABELS[status].toLowerCase()} ».` })
    } catch (error) {
      setNotice({ tone: 'error', text: mutationMessage(error, 'Changement de statut impossible.') })
    }
  }

  const confirmTransition = async (reason: string) => {
    if (!asking) return
    try {
      await transitionReward.mutateAsync({ id: asking.rewardId, action: asking.action, reason, idempotency_key: crypto.randomUUID() })
      setNotice({ tone: 'success', text: asking.action === 'cancelled' ? 'Récompense annulée.' : 'Récompense rouverte.' })
    } catch (error) {
      setNotice({ tone: 'error', text: mutationMessage(error, 'Action impossible.') })
    } finally {
      setAsking(null)
    }
  }

  const dialog = asking ? (
    <RewardReasonDialog
      title={asking.action === 'cancelled' ? 'Annuler la récompense' : 'Rouvrir la récompense'}
      description={
        asking.action === 'cancelled'
          ? 'La récompense n’est plus réclamable. Le motif est conservé dans l’historique.'
          : 'La récompense redevient réclamable. Le motif est conservé dans l’historique.'
      }
      confirmLabel={asking.action === 'cancelled' ? 'Annuler la récompense' : 'Rouvrir'}
      pending={transitionReward.isPending}
      onConfirm={(reason) => void confirmTransition(reason)}
      onCancel={() => setAsking(null)}
    />
  ) : null

  return {
    setStatus,
    askTransition: (rewardId, action) => setAsking({ rewardId, action }),
    pending: updateReward.isPending || transitionReward.isPending,
    notice,
    clearNotice: () => setNotice(null),
    dialog,
  }
}
