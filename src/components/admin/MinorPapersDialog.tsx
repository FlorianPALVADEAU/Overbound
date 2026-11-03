'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { MinorPapersChecks } from '@/lib/checkin/minorPapers'

const CHECKS: ReadonlyArray<{ key: keyof MinorPapersChecks; label: string }> = [
  { key: 'authorizationSigned', label: 'Autorisation parentale papier reçue, signée par le mineur et par un représentant légal' },
  { key: 'identityChecked', label: "Pièce d'identité du mineur contrôlée : nom et âge correspondent" },
  { key: 'referentIdentified', label: "Adulte présent sur place identifié, son numéro est joignable" },
  { key: 'healthAttestationSeen', label: 'Attestation du questionnaire de santé mineur présentée' },
]

interface MinorPapersDialogProps {
  /** Who the papers are for; null keeps the dialog closed. */
  email: string | null
  submitting: boolean
  onConfirm: (checks: MinorPapersChecks) => void
  onCancel: () => void
}

/** Desk control of a minor's papers: the check-in goes through only once the volunteer ticks all four. */
export function MinorPapersDialog({ email, submitting, onConfirm, onCancel }: MinorPapersDialogProps) {
  const [ticked, setTicked] = useState<Partial<Record<keyof MinorPapersChecks, boolean>>>({})
  const allTicked = CHECKS.every(({ key }) => ticked[key] === true)

  return (
    <Dialog open={email !== null} onOpenChange={(open) => (open ? undefined : onCancel())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mineur : contrôle des papiers</DialogTitle>
          <DialogDescription>
            {email} a moins de 18 ans. Le départ n&apos;est pas enregistré tant que les quatre papiers ne sont pas contrôlés.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {CHECKS.map(({ key, label }) => (
            <label key={key} className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
              <Checkbox
                className="mt-0.5"
                checked={ticked[key] === true}
                onCheckedChange={(checked) => setTicked((previous) => ({ ...previous, [key]: checked === true }))}
              />
              {label}
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Annuler
          </Button>
          <Button
            type="button"
            disabled={!allTicked || submitting}
            onClick={() => onConfirm({ authorizationSigned: true, identityChecked: true, referentIdentified: true, healthAttestationSeen: true })}
          >
            Papiers contrôlés, enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
