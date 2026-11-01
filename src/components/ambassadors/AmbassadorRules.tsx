import { Info } from 'lucide-react'
import { Disclosure } from '@/components/ds'
import { POINTS_OPEN, POINTS_RANKED } from '@/lib/ambassadors/program'

import { formatAmbassadorLongDate } from '@/lib/ambassadors/dashboardPresentation'

interface AmbassadorRulesProps {
  seasonEndsAt: string | null
}

export function AmbassadorRules({ seasonEndsAt }: AmbassadorRulesProps) {
  const endDate = formatAmbassadorLongDate(seasonEndsAt)
  return (
    <Disclosure icon={<Info className="size-4" />} title="Comment ça marche" summary="Points, paliers, conditions">
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li>Une inscription Open avec ton code vaut {POINTS_OPEN} point, une Ranked {POINTS_RANKED} points.</li>
        <li>Les points arrivent quand la commande est payée.</li>
        <li>Pas de point pour ta propre inscription ni pour une inscription gratuite.</li>
        <li>Un remboursement ou une annulation retire les points. Une récompense pas encore réclamée peut alors être retirée.</li>
        <li>Tu réclames une récompense depuis cette page, puis l&apos;équipe Overbound te contacte par email.</li>
        <li>{endDate ? `Les récompenses gagnées sont à réclamer avant la fin de la saison, le ${endDate}. Passé cette date, elles expirent.` : 'Les récompenses gagnées sont à réclamer avant la fin de la saison. Passé cette date, elles expirent.'}</li>
      </ul>
    </Disclosure>
  )
}
