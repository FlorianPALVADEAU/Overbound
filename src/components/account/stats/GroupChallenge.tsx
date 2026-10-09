import { SwordsIcon } from 'lucide-react'
import { ComingSoon } from './ComingSoon'
import { Leaderboard } from './Leaderboard'
import { ChartBlock } from './StatsBlocks'
import { TEASER_CHALLENGE, TEASER_CHALLENGE_CONTRIBUTORS } from './mockStats'

/** Sample challenge, only shown blurred until group challenges exist. */
function SampleChallenge() {
  const percent = Math.round((TEASER_CHALLENGE.done / TEASER_CHALLENGE.target) * 100)
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <SwordsIcon className="mt-1 size-6 shrink-0 text-primary" />
        <div>
          <p className="text-xl font-black leading-tight">{TEASER_CHALLENGE.title}</p>
          <p className="text-sm text-muted-foreground">{TEASER_CHALLENGE.description}</p>
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-3xl font-black tabular-nums">
            {TEASER_CHALLENGE.done}
            <span className="text-lg font-bold text-muted-foreground"> / {TEASER_CHALLENGE.target} tours</span>
          </p>
          <p className="text-sm font-bold text-primary">{TEASER_CHALLENGE.daysLeft} j restants</p>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <Leaderboard rows={TEASER_CHALLENGE_CONTRIBUTORS} />
    </div>
  )
}

export function GroupChallenge() {
  return (
    <ChartBlock title="Défi de groupe">
      <ComingSoon title="Relevez un défi ensemble" hint="Un objectif collectif, un classement des contributions et une récompense à partager. Bientôt disponible.">
        <SampleChallenge />
      </ComingSoon>
    </ChartBlock>
  )
}
