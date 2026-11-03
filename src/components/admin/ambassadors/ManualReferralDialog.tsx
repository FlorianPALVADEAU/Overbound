'use client'

import { useState } from 'react'
import { useAddManualReferralWithPoints, type AdminAmbassadorPointsRow } from '@/app/api/admin/ambassadors/ambassadorsQueries'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { mutationMessage } from './rewardStatus'

type ReferralFormat = 'auto' | 'open' | 'ranked'
const FORMATS: ReadonlyArray<{ value: ReferralFormat; label: string }> = [
  { value: 'auto', label: 'Auto (détection du billet)' },
  { value: 'open', label: 'OPEN' },
  { value: 'ranked', label: 'RANKED' },
]
const isFormat = (value: string): value is ReferralFormat => FORMATS.some((format) => format.value === value)

/** Credits an offline referral: the referred person's registration is linked and the points are added once. */
export function ManualReferralDialog({ ambassador, onClose }: { ambassador: AdminAmbassadorPointsRow; onClose: () => void }) {
  const addReferral = useAddManualReferralWithPoints()
  const [email, setEmail] = useState('')
  const [points, setPoints] = useState('1')
  const [format, setFormat] = useState<ReferralFormat>('auto')
  const [result, setResult] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const parsedPoints = Math.trunc(Number(points))
  const valid = email.trim().length > 0 && parsedPoints >= 1 && parsedPoints <= 10

  const submit = async () => {
    setResult(null)
    try {
      const response = await addReferral.mutateAsync({ ambassador_id: ambassador.ambassador_id, referral_email: email.trim(), points: parsedPoints, race_format: format })
      setResult({
        tone: 'success',
        text: response.already_credited
          ? 'Filleul ajouté (ou déjà présent). Aucun point ajouté car cette inscription était déjà créditée.'
          : `Filleul ajouté et ${response.points_credited} point(s) crédité(s).`,
      })
    } catch (caught) {
      setResult({ tone: 'error', text: mutationMessage(caught, 'Ajout impossible.') })
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && !addReferral.isPending && onClose()}>
      <DialogContent className="sm:max-w-130">
        <DialogHeader>
          <DialogTitle>Ajouter un filleul et créditer des points</DialogTitle>
          <DialogDescription>Ajoute un inscrit parmi les filleuls et crédite les points sans doublon.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="rounded-xl border px-3 py-2 text-sm">
            <p className="font-semibold">{ambassador.ambassador_name}</p>
            <p className="font-mono text-xs text-muted-foreground">{ambassador.ambassador_code ?? '—'}</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="referral-email">E-mail du filleul</Label>
            <Input id="referral-email" type="email" placeholder="exemple@mail.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="referral-points">Points à créditer</Label>
              <Input id="referral-points" type="number" min={1} max={10} value={points} onChange={(event) => setPoints(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="referral-format">Format</Label>
              <Select value={format} onValueChange={(value) => isFormat(value) && setFormat(value)}>
                <SelectTrigger id="referral-format"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMATS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {result ? (
            <Alert variant={result.tone === 'error' ? 'destructive' : 'default'} role="status">
              <AlertDescription>{result.text}</AlertDescription>
            </Alert>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={addReferral.isPending}>Fermer</Button>
          <Button type="button" onClick={() => void submit()} disabled={!valid || addReferral.isPending}>
            {addReferral.isPending ? 'Traitement…' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
