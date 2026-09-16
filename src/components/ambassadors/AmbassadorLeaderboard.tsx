'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Trophy } from 'lucide-react'
import type { AmbassadorDashboardData } from '@/types/Ambassador'

interface AmbassadorLeaderboardProps {
  leaderboard: AmbassadorDashboardData['leaderboard']
}

export function AmbassadorLeaderboard({ leaderboard }: AmbassadorLeaderboardProps) {
  return (
    <Card>
      <CardHeader className="pb-3 pt-5">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4" />
          Classement ambassadeurs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
          {leaderboard.current_user_rank ? (
            <p>
              Tu es actuellement <span className="font-bold text-primary">#{leaderboard.current_user_rank}</span> sur {leaderboard.total_ambassadors} ambassadeurs actifs.
            </p>
          ) : (
            <p>Tu apparaitras dans le classement dès que ton profil ambassadeur sera actif.</p>
          )}
        </div>
        {leaderboard.top.length === 0 ? (
          <p className="text-sm text-muted-foreground">Classement indisponible pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.top.map((entry) => (
              <div
                key={`${entry.rank}-${entry.name}`}
                className={cn(
                  'flex items-center justify-between rounded-lg border px-3 py-2 text-sm',
                  entry.is_current_user && 'border-primary/40 bg-primary/10',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn('w-7 text-center font-semibold', entry.rank <= 3 && 'text-primary')}>
                    #{entry.rank}
                  </span>
                  <span className={cn(entry.is_current_user && 'font-semibold text-primary')}>
                    {entry.name}
                  </span>
                </div>
                <span className="font-semibold tabular-nums">{entry.points} pts</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
