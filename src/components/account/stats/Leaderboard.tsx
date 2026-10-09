import { cn } from '@/lib/utils'

export interface LeaderboardRow {
  name: string
  km: number
  laps: number
  isSelf?: boolean
}

const MEDALS = ['bg-amber-400 text-black', 'bg-zinc-300 text-black', 'bg-orange-400 text-black']

/** Ranked list with a proportional bar; the first three get a medal. */
export function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  const max = Math.max(...rows.map((row) => row.km), 1)

  return (
    <ol className="space-y-3">
      {rows.map((row, index) => (
        <li key={row.name} className={cn('flex items-center gap-3 rounded-xl px-3 py-2', row.isSelf && 'bg-primary/10 ring-1 ring-primary/30')}>
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-black tabular-nums',
              MEDALS[index] ?? 'bg-muted text-muted-foreground',
            )}
          >
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-bold">{row.name}</p>
              <p className="shrink-0 text-sm font-black tabular-nums">
                {row.km} <span className="text-xs font-semibold text-muted-foreground">km · {row.laps} tours</span>
              </p>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(row.km / max) * 100}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
