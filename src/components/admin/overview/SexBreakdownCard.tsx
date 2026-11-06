import type { SexBreakdown } from '@/lib/admin/overview'
import { PARTICIPANT_SEX_BAR_CLASS, PARTICIPANT_SEX_LABELS, PARTICIPANT_SEX_UNKNOWN_LABEL } from '@/lib/shared/presentation/participantSex'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const percent = (ratio: number) => `${Math.round(ratio * 100)} %`

/** Men and women among the active bibs, as a share of the bibs whose sex is known. */
export function SexBreakdownCard({ sex }: { sex: SexBreakdown }) {
  const known = sex.homme + sex.femme
  const rows = [
    { key: 'homme', count: sex.homme, share: sex.hommeShare },
    { key: 'femme', count: sex.femme, share: sex.femmeShare },
  ] as const

  return (
    <Card variant="info">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Hommes et femmes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {known === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun dossard actif avec un sexe renseigné.</p>
        ) : (
          <>
            <div
              className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={`Hommes ${percent(sex.hommeShare ?? 0)}, femmes ${percent(sex.femmeShare ?? 0)}`}
            >
              {rows.map((row) => (
                <div
                  key={row.key}
                  className={cn('h-full transition-all duration-300 ease-standard', PARTICIPANT_SEX_BAR_CLASS[row.key])}
                  style={{ width: `${(row.share ?? 0) * 100}%` }}
                />
              ))}
            </div>
            <ul className="grid grid-cols-2 gap-3">
              {rows.map((row) => (
                <li key={row.key} className="space-y-1">
                  <p className="text-sm text-muted-foreground">{PARTICIPANT_SEX_LABELS[row.key]}</p>
                  <p className="font-display text-title font-bold tabular-nums">{row.share === null ? '—' : percent(row.share)}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{row.count} dossard{row.count > 1 ? 's' : ''}</p>
                </li>
              ))}
            </ul>
          </>
        )}
        {sex.unknown > 0 ? (
          <p className="text-xs text-muted-foreground">
            {sex.unknown} dossard{sex.unknown > 1 ? 's' : ''} sans sexe ({PARTICIPANT_SEX_UNKNOWN_LABEL.toLowerCase()}, inscriptions faites avant la question), hors calcul.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
