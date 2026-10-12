'use client'

import { Disclosure } from '@/components/ds'
import { cn } from '@/lib/utils'
import { Trophy } from 'lucide-react'
import type { AmbassadorDashboardData } from '@/types/Ambassador'

interface AmbassadorLeaderboardProps {
  leaderboard: AmbassadorDashboardData['leaderboard']
}

export function AmbassadorLeaderboard({ leaderboard }: AmbassadorLeaderboardProps) {
  const rank = leaderboard.current_user_rank
  return (
    <Disclosure
      icon={<Trophy className="size-4" />}
      title="Classement"
      summary={rank ? `#${rank} sur ${leaderboard.total_ambassadors} ambassadeurs` : 'Pas encore classé'}
    >
      <div className="space-y-3">
        <p className="text-sm">
          {rank ? (
            <>
              Tu es <span className="font-semibold text-primary">#{rank}</span> sur {leaderboard.total_ambassadors} ambassadeurs actifs.
            </>
          ) : (
            'Tu apparaitras dans le classement dès que ton profil ambassadeur sera actif.'
          )}
        </p>
        {leaderboard.top.length === 0 ? (
          <p className="text-sm text-muted-foreground">Classement indisponible pour le moment.</p>
        ) : (
          <ol className="space-y-1.5">
            {leaderboard.top.map((entry) => (
              <li
                key={`${entry.rank}-${entry.name}`}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm',
                  entry.is_current_user && 'border-primary/40 bg-primary/10',
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className={cn('w-7 shrink-0 text-center font-semibold', entry.rank <= 3 && 'text-primary')}>#{entry.rank}</span>
                  <span className={cn('truncate', entry.is_current_user && 'font-semibold text-primary')}>{entry.name}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{entry.points} pts</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Disclosure>
  )
}
