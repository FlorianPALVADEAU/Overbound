import { Trophy } from 'lucide-react'
import { Disclosure } from '@/components/ds'
import type { AmbassadorLeaderboard as Leaderboard } from '@/types/Ambassador'
import { cn } from '@/lib/utils'

interface AmbassadorLeaderboardProps {
  leaderboard: Leaderboard
  /** Open from the start on phones (a rival is within reach). From lg the list is always shown. */
  defaultOpen?: boolean
}

/** Non-breaking space: the unit never wraps alone on a line. */
const plural = (count: number) => (count > 1 ? 'points' : 'point')

export function AmbassadorLeaderboard({ leaderboard, defaultOpen = false }: AmbassadorLeaderboardProps) {
  const { top, current_user_rank: rank, current_points: ownPoints, chase, total_ranked: total } = leaderboard
  const viewerOutsideTop = rank !== null && rank > top.length

  return (
    <Disclosure
      icon={<Trophy className="size-4" />}
      title="Classement"
      summary={rank ? `Tu es ${rank}e sur ${total}` : 'Marque ton premier point pour entrer au classement'}
      defaultOpen={defaultOpen}
    >
      {top.length === 0 ? (
        <p className="text-sm text-muted-foreground">Personne n&apos;a encore de point. Le premier parrainage te met en tête.</p>
      ) : (
        <div className="space-y-4">
          {chase ? (
            <p className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium">
              Pour passer devant {chase.name} : encore {chase.points_to_pass}{'\u00a0'}{plural(chase.points_to_pass)}
            </p>
          ) : rank === 1 ? (
            <p className="rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-sm font-medium text-success">Tu es en tête du classement.</p>
          ) : null}
          <ol className="space-y-1">
            {top.map((row) => (
              <li
                key={row.rank}
                className={cn('flex items-center gap-3 rounded-xl px-3 py-2', row.is_current_user && 'bg-primary/10 font-semibold')}
              >
                <span className="w-6 shrink-0 font-display text-title font-bold">{row.rank}</span>
                <span className="min-w-0 flex-1 truncate">{row.is_current_user ? `${row.name} (toi)` : row.name}</span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{row.points} pts</span>
              </li>
            ))}
            {viewerOutsideTop ? (
              <li className="flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-2 font-semibold">
                <span className="w-6 shrink-0 font-display text-title font-bold">{rank}</span>
                <span className="min-w-0 flex-1 truncate">Toi</span>
                {ownPoints !== null && ownPoints !== undefined ? (
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{ownPoints}{'\u00a0'}{plural(ownPoints)}</span>
                ) : null}
              </li>
            ) : null}
          </ol>
        </div>
      )}
    </Disclosure>
  )
}
