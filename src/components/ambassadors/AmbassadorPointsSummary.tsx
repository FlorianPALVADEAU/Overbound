'use client'

import { Card, CardContent } from '@/components/ui/card'
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      <Card variant="info" className="gap-0 py-0">
        <CardContent className="p-4 sm:p-6">
          <p className="text-label font-semibold uppercase text-subtle">Tes points</p>
          <p className="mt-1 font-display text-display-md font-bold leading-none tabular-nums">
            {totalPoints}
            <span className="ml-2 text-title text-muted-foreground">pts</span>
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{openCount} Open</span>
            <span>
              {rankedCount} Ranked <span className="font-semibold text-primary">×2</span>
            </span>
          </p>
        </CardContent>
      </Card>

      <Card variant="info" className="gap-0 py-0">
        <CardContent className="p-4 sm:p-6">
          {nextReward ? (
            <>
              <p className="text-label font-semibold uppercase text-subtle">Prochain palier</p>
              <p className="mt-1 font-semibold leading-snug">{nextReward.reward_name}</p>
              <div className="mt-3 space-y-1.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300 ease-standard"
                    style={{ width: `${segmentFill}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{totalPoints} pts</span>
                  <span className="font-semibold text-primary">
                    encore {nextReward.points_remaining} pt{nextReward.points_remaining > 1 ? 's' : ''}
                  </span>
                  <span>{nextReward.points_required} pts</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col justify-center">
              <p className="font-semibold text-primary">Tous les paliers débloqués 🏆</p>
              <p className="mt-1 text-sm text-muted-foreground">Tu as atteint le statut maximum.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
