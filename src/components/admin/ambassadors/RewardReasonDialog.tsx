'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const MIN_REASON_LENGTH = 3

interface RewardReasonDialogProps {
  title: string
  description: string
  confirmLabel: string
  pending: boolean
  onConfirm: (reason: string) => void
  onCancel: () => void
}

/** Asks for the reason an admin must give before cancelling or reopening a reward (kept in the audit trail). */
export function RewardReasonDialog({ title, description, confirmLabel, pending, onConfirm, onCancel }: RewardReasonDialogProps) {
  const [reason, setReason] = useState('')
  const trimmed = reason.trim()

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onCancel()}>
      <DialogContent className="sm:max-w-130">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="reward-reason">Motif obligatoire</Label>
          <Input id="reward-reason" autoFocus value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ex. inscription remboursée" />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>Retour</Button>
          <Button type="button" disabled={trimmed.length < MIN_REASON_LENGTH || pending} onClick={() => onConfirm(trimmed)}>
            {pending ? 'Enregistrement…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
