'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap } from 'lucide-react'
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

  return (
    <Card>
      <CardHeader className="pb-3 pt-5">
        <CardTitle className="flex items-center gap-2 text-base">
          Tes récompenses débloquées
          <Badge variant="secondary">{rewards.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actionError && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        )}
        {actionSuccess && (
          <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
            {actionSuccess}
          </p>
        )}
        {rewards.map((reward) => {
          const meta = TIER_META[reward.reward_level]
          const Icon = meta?.icon ?? FALLBACK_TIER_ICON
          return (
            <div
              key={reward.id}
              className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Palier {reward.reward_level} — {reward.reward_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Débloquée le {formatAmbassadorDate(reward.earned_at)}
                    {reward.claimed_at
                      ? ` · Réclamée le ${formatAmbassadorDate(reward.claimed_at)}`
                      : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={REWARD_STATUS_STYLES[reward.status]}>
                  {REWARD_STATUS_LABELS[reward.status]}
                </Badge>
                {reward.status === 'earned' && (
                  <Button
                    size="sm"
                    onClick={() => onClaim(reward.reward_level)}
                    disabled={claimingLevel === reward.reward_level}
                  >
                    {claimingLevel === reward.reward_level ? 'Envoi…' : 'Réclamer'}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
