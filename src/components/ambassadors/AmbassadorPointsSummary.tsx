'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { AmbassadorNextReward } from '@/types/Ambassador'

interface AmbassadorPointsSummaryProps {
  totalPoints: number
  openCount: number
  rankedCount: number
  nextReward: AmbassadorNextReward | null
  segmentFill: number
}

export function AmbassadorPointsSummary({
  totalPoints,
  openCount,
  rankedCount,
  nextReward,
  segmentFill,
}: AmbassadorPointsSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/8 to-transparent">
        <CardContent className="p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary/60">
            Tes points
          </p>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black tabular-nums leading-none sm:text-6xl">{totalPoints}</span>
            <span className="mb-1 text-lg font-bold text-muted-foreground sm:text-xl">pts</span>
          </div>
          <div className="mt-3 flex items-center gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary/40" />
              {openCount} Open
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {rankedCount} Ranked
              <span className="text-[10px] font-bold text-primary">×2</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className={cn('border-border/60', nextReward && 'border-primary/25')}>
        <CardContent className="p-5">
          {nextReward ? (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Prochain palier
              </p>
              <p className="text-lg font-bold leading-snug">{nextReward.reward_name}</p>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span className="font-medium">{totalPoints} pts</span>
                  <span className="font-bold text-primary">
                    encore {nextReward.points_remaining} pt
                    {nextReward.points_remaining > 1 ? 's' : ''}
                  </span>
                  <span>{nextReward.points_required} pts</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${segmentFill}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col justify-center py-2">
              <p className="text-base font-bold text-primary">
                Tous les paliers débloqués 🏆
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tu as atteint le statut maximum.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
