import { History } from 'lucide-react'
import { Disclosure } from '@/components/ds'
import { Badge } from '@/components/ui/badge'
import { REWARD_KIND_META, REWARD_STATUS_LABELS, REWARD_STATUS_STYLES } from '@/lib/ambassadors/dashboardPresentation'
import type { AmbassadorPreviousEdition as PreviousEdition } from '@/types/Ambassador'
import { cn } from '@/lib/utils'

interface AmbassadorPreviousEditionProps {
  edition: PreviousEdition
}

/** Read only. What the ambassador kept from the edition that was closed. */
export function AmbassadorPreviousEdition({ edition }: AmbassadorPreviousEditionProps) {
  return (
    <Disclosure
      icon={<History className="size-4" />}
      title={edition.label}
      summary={`${edition.total_points} points · ${edition.rewards.length} récompense${edition.rewards.length > 1 ? 's' : ''} obtenue${edition.rewards.length > 1 ? 's' : ''}`}
    >
      <p className="text-sm text-muted-foreground">Le programme a redémarré à zéro. Voici ce que tu as obtenu avant.</p>
      {edition.rewards.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {edition.rewards.map((reward) => {
            const Icon = REWARD_KIND_META[reward.kind].icon
            return (
              <li key={reward.id} className="flex items-center gap-3">
                <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">{reward.reward_name}</span>
                <Badge className={cn(REWARD_STATUS_STYLES[reward.status])}>{REWARD_STATUS_LABELS[reward.status]}</Badge>
              </li>
            )
          })}
        </ul>
      ) : null}
    </Disclosure>
  )
}
