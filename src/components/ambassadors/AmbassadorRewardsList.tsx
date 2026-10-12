'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Disclosure } from '@/components/ds'
import { Gift } from 'lucide-react'
import {
  FALLBACK_TIER_ICON,
  REWARD_STATUS_LABELS,
  REWARD_STATUS_STYLES,
  TIER_META,
  formatAmbassadorDate,
} from '@/lib/ambassadors/dashboardPresentation'
import type { AmbassadorReward } from '@/types/Ambassador'

interface AmbassadorRewardsListProps {
  rewards: AmbassadorReward[]
  claimingLevel: number | null
  actionError: string | null
  actionSuccess: string | null
  onClaim: (rewardLevel: number) => void
}

export function AmbassadorRewardsList({
  rewards,
  claimingLevel,
  actionError,
  actionSuccess,
  onClaim,
}: AmbassadorRewardsListProps) {
  if (rewards.length === 0) return null
  const claimable = rewards.filter((reward) => reward.status === 'earned').length

  return (
    <Disclosure
      defaultOpen={claimable > 0}
      icon={<Gift className="size-4" />}
      title="Tes récompenses"
      badge={<Badge variant="secondary">{rewards.length}</Badge>}
      summary={claimable > 0 ? `${claimable} à réclamer` : undefined}
    >
      <div className="space-y-3">
        {actionError ? <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{actionError}</p> : null}
        {actionSuccess ? <p className="rounded-xl bg-success/10 px-3 py-2 text-sm text-success">{actionSuccess}</p> : null}
        <ul className="divide-y divide-border">
          {rewards.map((reward) => {
            const Icon = TIER_META[reward.reward_level]?.icon ?? FALLBACK_TIER_ICON
            return (
              <li key={reward.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      Palier {reward.reward_level} — {reward.reward_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Débloquée le {formatAmbassadorDate(reward.earned_at)}
                      {reward.claimed_at ? ` · Réclamée le ${formatAmbassadorDate(reward.claimed_at)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <Badge className={REWARD_STATUS_STYLES[reward.status]}>{REWARD_STATUS_LABELS[reward.status]}</Badge>
                  {reward.status === 'earned' ? (
                    <Button size="sm" onClick={() => onClaim(reward.reward_level)} disabled={claimingLevel === reward.reward_level}>
                      {claimingLevel === reward.reward_level ? 'Envoi…' : 'Réclamer'}
                    </Button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </Disclosure>
  )
}
