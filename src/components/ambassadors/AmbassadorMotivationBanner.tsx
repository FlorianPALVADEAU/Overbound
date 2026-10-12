'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Lock, Share2, Star, Zap } from 'lucide-react'
import { TIER_META } from '@/lib/ambassadors/dashboardPresentation'
import type { AmbassadorNextReward, AmbassadorRecruitRow } from '@/types/Ambassador'

interface AmbassadorRewardLevel {
  reward_level: number
  reward_name: string
  points_required: number
}

interface AmbassadorMotivationBannerProps {
  nextReward: AmbassadorNextReward | null
  fomoLevels: AmbassadorRewardLevel[]
  latestPointsEvent: AmbassadorRecruitRow | null
  code: string | null
  onShare: () => void
}

export function AmbassadorMotivationBanner({
  nextReward,
  fomoLevels,
  latestPointsEvent,
  code,
  onShare,
}: AmbassadorMotivationBannerProps) {
  if (!nextReward) {
    return (
      <Card variant="info" className="gap-0 border-success/30 bg-success/5 py-0">
        <CardContent className="flex items-start gap-3 p-4 sm:p-6">
          <Star className="mt-0.5 size-5 shrink-0 text-success" />
          <div>
            <p className="font-semibold">Tous les paliers débloqués ! Tu es une légende Overbound 🏆</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Tu as atteint le statut maximum. Merci pour ton engagement.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const tierDescription = TIER_META[nextReward.reward_level]?.description

  return (
    <Card variant="info" className="gap-0 border-primary/30 bg-primary/5 py-0">
      <CardContent className="space-y-3 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Zap className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="font-semibold">
                Plus que {nextReward.points_remaining} point{nextReward.points_remaining > 1 ? 's' : ''} pour débloquer :
              </p>
              <p className="mt-0.5 text-sm font-semibold text-primary">{nextReward.reward_name}</p>
              {tierDescription ? <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{tierDescription}</p> : null}
              <p className="mt-1 text-xs text-muted-foreground">Open = 1 pt · Ranked = 2 pts</p>
              {latestPointsEvent ? (
                <p className="mt-1 text-xs font-semibold text-success">
                  Dernier gain : +{latestPointsEvent.points} point{latestPointsEvent.points > 1 ? 's' : ''}
                  {latestPointsEvent.race_format === 'ranked' ? ' (bonus Ranked)' : ''}
                </p>
              ) : null}
            </div>
          </div>
          {code ? (
            <Button size="sm" onClick={onShare} className="w-full shrink-0 sm:w-auto">
              <Share2 />
              Partager maintenant
            </Button>
          ) : null}
        </div>

        {fomoLevels.length > 0 ? (
          <div className="hidden border-t border-border pt-3 sm:block">
            <p className="mb-2 text-label font-semibold uppercase text-subtle">Et ensuite…</p>
            <div className="flex flex-wrap gap-2">
              {fomoLevels.map((level) => {
                const Icon = TIER_META[level.reward_level]?.icon ?? Lock
                return (
                  <span key={level.reward_level} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-subtle">
                    <Lock className="size-3" />
                    <Icon className="size-3" />
                    {level.reward_name} ({level.points_required} pts)
                  </span>
                )
              })}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
