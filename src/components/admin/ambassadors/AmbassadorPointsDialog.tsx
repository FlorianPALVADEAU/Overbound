'use client'

import { useState } from 'react'
import { useUpdateAmbassadorPoints, type AdminAmbassadorPointsRow } from '@/app/api/admin/ambassadors/ambassadorsQueries'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mutationMessage } from './rewardStatus'

interface AmbassadorPointsDialogProps {
  ambassador: AdminAmbassadorPointsRow
  /** Season the totals belong to; the correction is written to this one. */
  programYear: number
  onClose: () => void
}

const toCount = (value: string) => Math.max(0, Math.trunc(Number(value) || 0))

/** Manual correction of an ambassador's season totals. The reason is mandatory and audited. */
export function AmbassadorPointsDialog({ ambassador, programYear, onClose }: AmbassadorPointsDialogProps) {
  const updatePoints = useUpdateAmbassadorPoints()
  const [total, setTotal] = useState(String(ambassador.total_points))
  const [open, setOpen] = useState(String(ambassador.recruits_open))
  const [ranked, setRanked] = useState(String(ambassador.recruits_ranked))
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setError(null)
    try {
      await updatePoints.mutateAsync({
        ambassador_id: ambassador.ambassador_id,
        total_points: toCount(total),
        recruits_open: toCount(open),
        recruits_ranked: toCount(ranked),
        program_year: programYear,
        reason: reason.trim(),
        idempotency_key: crypto.randomUUID(),
      })
      onClose()
    } catch (caught) {
      setError(mutationMessage(caught, 'Correction impossible.'))
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && !updatePoints.isPending && onClose()}>
      <DialogContent className="sm:max-w-130">
        <DialogHeader>
          <DialogTitle>Modifier les points</DialogTitle>
          <DialogDescription>Saison {programYear}. Ajuste le total et la répartition Open et Ranked.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="rounded-xl border px-3 py-2 text-sm">
            <p className="font-semibold">{ambassador.ambassador_name}</p>
            <p className="font-mono text-xs text-muted-foreground">{ambassador.ambassador_code ?? '—'}</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="points-total">Total des points</Label>
            <Input id="points-total" type="number" min={0} value={total} onChange={(event) => setTotal(event.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="points-open">Filleuls Open</Label>
              <Input id="points-open" type="number" min={0} value={open} onChange={(event) => setOpen(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="points-ranked">Filleuls Ranked</Label>
              <Input id="points-ranked" type="number" min={0} value={ranked} onChange={(event) => setRanked(event.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="points-reason">Motif obligatoire</Label>
            <Input id="points-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ex. correction après vérification d’une inscription" />
          </div>
          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={updatePoints.isPending}>Annuler</Button>
          <Button type="button" onClick={() => void save()} disabled={updatePoints.isPending || reason.trim().length < 3}>
            {updatePoints.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
