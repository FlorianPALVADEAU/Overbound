'use client'

import { Button } from '@/components/ui/button'
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
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5">
        <div className="flex items-start gap-3">
          <Star className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-bold">
              Tous les paliers débloqués ! Tu es une légende Overbound 🏆
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Tu as atteint le statut maximum. Merci pour ton engagement.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-r from-primary/8 via-primary/4 to-transparent p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Zap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-bold">
              Plus que {nextReward.points_remaining} point{nextReward.points_remaining > 1 ? 's' : ''} pour débloquer :
            </p>
            <p className="mt-0.5 text-sm font-semibold text-primary">
              {nextReward.reward_name}
            </p>
            {TIER_META[nextReward.reward_level] && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {TIER_META[nextReward.reward_level].description}
              </p>
            )}
            <p className="mt-1.5 text-[11px] text-muted-foreground/70">
              Open = 1 pt · Ranked = 2 pts
            </p>
            {latestPointsEvent && (
              <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">
                Dernier gain: +{latestPointsEvent.points} point{latestPointsEvent.points > 1 ? 's' : ''}
                {latestPointsEvent.race_format === 'ranked' ? ' (bonus Ranked)' : ''}
              </p>
            )}
          </div>
        </div>
        {code && (
          <Button size="sm" onClick={onShare} className="shrink-0 gap-2 sm:self-start">
            <Share2 className="h-3.5 w-3.5" />
            Partager maintenant
          </Button>
        )}
      </div>

      {/* Locked levels teaser */}
      {fomoLevels.length > 0 && (
        <div className="mt-4 border-t border-primary/10 pt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Et ensuite…
          </p>
          <div className="flex flex-wrap gap-2">
            {fomoLevels.map((l) => {
              const FomoIcon = TIER_META[l.reward_level]?.icon ?? Lock
              return (
                <div
                  key={l.reward_level}
                  className="flex items-center gap-1.5 rounded-full border border-border/40 bg-background/50 px-3 py-1 text-[11px] text-muted-foreground/55 backdrop-blur-sm"
                >
                  <Lock className="h-3 w-3" />
                  <FomoIcon className="h-3 w-3" />
                  <span>{l.reward_name}</span>
                  <span className="font-bold">({l.points_required} pts)</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
