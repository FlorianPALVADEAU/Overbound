'use client'

import { useState } from 'react'
import {
  useAdminPromoCodeOptions,
  useAmbassadorCodes,
  useAssignAmbassadorCode,
  useRemoveAmbassadorCode,
  useSetCurrentAmbassadorCode,
} from '@/app/api/admin/ambassadors/ambassadorsQueries'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { mutationMessage } from '../rewardStatus'

/** Promo codes of one ambassador: the one shared is marked current; any can be made current, removed, or added. */
export function AmbassadorCodesPanel({ ambassadorId }: { ambassadorId: string }) {
  const { data: codesData, isLoading } = useAmbassadorCodes(ambassadorId)
  const { data: optionsData } = useAdminPromoCodeOptions()
  const assignCode = useAssignAmbassadorCode()
  const setCurrentCode = useSetCurrentAmbassadorCode()
  const removeCode = useRemoveAmbassadorCode()
  const [codeToAdd, setCodeToAdd] = useState('')
  const [asCurrent, setAsCurrent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const codes = codesData?.codes ?? []
  const assignedIds = new Set(codes.map((code) => code.promotional_code_id))
  const available = (optionsData?.codes ?? []).filter((code) => !assignedIds.has(code.id) && !code.assigned_profile_id)
  const busy = assignCode.isPending || setCurrentCode.isPending || removeCode.isPending

  const run = async (action: () => Promise<unknown>) => {
    setError(null)
    try {
      await action()
    } catch (caught) {
      setError(mutationMessage(caught, 'Action impossible.'))
    }
  }

  return (
    <div className="grid gap-6">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : codes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun code assigné.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {codes.map((code) => (
            <li key={code.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="break-all font-mono text-sm font-medium">{code.code ?? code.promotional_code_id}</span>
                {code.name ? <span className="text-xs text-muted-foreground">{code.name}</span> : null}
                {code.is_current ? <Badge className="border-success/40 bg-success/20 text-success">Actif</Badge> : null}
                {!code.is_active ? <Badge variant="outline">Code désactivé</Badge> : null}
              </div>
              <div className="flex items-center gap-1">
                {!code.is_current ? (
                  <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void run(() => setCurrentCode.mutateAsync({ ambassadorId, junctionId: code.id }))}>
                    Définir actif
                  </Button>
                ) : null}
                <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => void run(() => removeCode.mutateAsync({ ambassadorId, junctionId: code.id }))}>
                  Retirer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 rounded-xl border px-3 py-3">
        <p className="text-xs font-semibold">Ajouter un code</p>
        <Select value={codeToAdd} onValueChange={setCodeToAdd}>
          <SelectTrigger aria-label="Code promo à ajouter"><SelectValue placeholder="Choisir un code promo…" /></SelectTrigger>
          <SelectContent>
            {available.length === 0 ? <div className="px-2 py-1.5 text-sm text-muted-foreground">Aucun code libre.</div> : null}
            {available.map((code) => (
              <SelectItem key={code.id} value={code.id}>{code.code}{code.name ? `, ${code.name}` : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Checkbox id="code-as-current" checked={asCurrent} onCheckedChange={(checked) => setAsCurrent(checked === true)} />
          <Label htmlFor="code-as-current" className="text-xs">Définir comme code actif</Label>
        </div>
        <Button
          type="button"
          size="sm"
          className="justify-self-start"
          disabled={!codeToAdd || busy}
          onClick={() =>
            void run(async () => {
              await assignCode.mutateAsync({ ambassadorId, promotional_code_id: codeToAdd, set_as_current: asCurrent })
              setCodeToAdd('')
              setAsCurrent(false)
            })
          }
        >
          {assignCode.isPending ? 'Assignation…' : 'Ajouter'}
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
