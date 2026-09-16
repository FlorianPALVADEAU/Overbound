'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Check, Lock } from 'lucide-react'
import {
  FALLBACK_TIER_ICON,
  TIER_META,
  getConnectorFill,
  getTierState,
} from '@/lib/ambassadors/dashboardPresentation'

interface AmbassadorRewardLevel {
  reward_level: number
  reward_name: string
  points_required: number
}

interface AmbassadorRewardsTimelineProps {
  levels: AmbassadorRewardLevel[]
  totalPoints: number
  nextRewardLevel: number | null
}

export function AmbassadorRewardsTimeline({ levels, totalPoints, nextRewardLevel }: AmbassadorRewardsTimelineProps) {
  return (
    <Card className="overflow-visible">
      <CardHeader className="pb-0 pt-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Parcours des récompenses
        </p>
      </CardHeader>
      <CardContent className="pt-8 pb-7">
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-[1200px] items-start gap-2 px-2 sm:gap-3">
            {levels.map((tier, i) => {
              const state = getTierState(tier.points_required, totalPoints, nextRewardLevel, tier.reward_level)
              const meta = TIER_META[tier.reward_level]
              const Icon = meta?.icon ?? FALLBACK_TIER_ICON
              const isLast = i === levels.length - 1
              const connFill = !isLast
                ? getConnectorFill(tier.points_required, levels[i + 1].points_required, totalPoints)
                : 0

              return (
                <div key={tier.reward_level} className="flex flex-1 items-start">
                  <div className="flex min-w-[120px] flex-1 flex-col items-center gap-1.5 sm:min-w-[130px]">
                    {/* Node circle */}
                    <div className="relative flex h-16 w-16 items-center justify-center">
                      {state === 'current' && (
                        <span className="absolute inset-0 rounded-full border border-primary/30 bg-primary/10 animate-pulse" />
                      )}
                      <div
                        className={cn(
                          'relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300',
                          state === 'unlocked' &&
                            'border-primary bg-primary text-white shadow-lg shadow-primary/25',
                          state === 'current' &&
                            'border-primary bg-background text-primary ring-4 ring-primary/10',
                          state === 'locked' &&
                            'border-border/40 bg-muted/30 text-muted-foreground/35',
                        )}
                      >
                        {state === 'unlocked' ? (
                          <Check className="h-5 w-5" />
                        ) : state === 'locked' ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                    </div>

                    <span
                      className={cn(
                        'text-[10px] font-bold tabular-nums',
                        state === 'unlocked' && 'text-primary',
                        state === 'current' && 'text-primary',
                        state === 'locked' && 'text-muted-foreground/40',
                      )}
                    >
                      {tier.points_required} pts
                    </span>

                    <p
                      className={cn(
                        'text-center text-[10px] leading-snug break-words',
                        state === 'unlocked' && 'font-semibold text-foreground',
                        state === 'current' && 'font-bold text-primary',
                        state === 'locked' && 'text-muted-foreground/45',
                      )}
                    >
                      {tier.reward_name}
                    </p>

                    {state === 'unlocked' && (
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-600">
                        ✓ Débloqué
                      </span>
                    )}
                    {state === 'current' && (
                      <span className="animate-pulse text-[9px] font-semibold uppercase tracking-wide text-primary">
                        En cours…
                      </span>
                    )}
                    {state === 'locked' && (
                      <span className="text-[9px] uppercase tracking-wide text-muted-foreground/35">
                        −{tier.points_required - totalPoints} pts
                      </span>
                    )}
                  </div>

                  {/* Connector */}
                  {!isLast && (
                    <div className="relative mt-8 mx-1 h-1 flex-1 overflow-hidden rounded-full bg-border/30">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${connFill}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
