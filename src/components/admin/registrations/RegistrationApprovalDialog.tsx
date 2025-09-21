'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { AdminRegistration } from '@/types/Registration'
import { CheckCircle, XCircle } from 'lucide-react'

interface RegistrationApprovalDialogProps {
  registration: AdminRegistration | null
  open: boolean
  loadingId?: string | null
  rejectionReason: string
  onOpenChange: (open: boolean) => void
  onRejectionReasonChange: (value: string) => void
  onApprove: () => void
  onReject: () => void
}

export function RegistrationApprovalDialog({
  registration,
  open,
  loadingId,
  rejectionReason,
  onOpenChange,
  onRejectionReasonChange,
  onApprove,
  onReject,
}: RegistrationApprovalDialogProps) {
  if (!registration) {
    return null
  }

  const isLoading = loadingId === registration.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approuver l'inscription</DialogTitle>
          <DialogDescription>
            Décidez du statut de l'inscription de {registration.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm">
            <p>
              <strong>Email :</strong> {registration.email}
            </p>
            {registration.event && (
              <p>
                <strong>Événement :</strong> {registration.event.title}
              </p>
            )}
            {registration.ticket && (
              <p>
                <strong>Ticket :</strong> {registration.ticket.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Raison du rejet (optionnelle)</label>
            <Textarea
              value={rejectionReason}
              onChange={(event) => onRejectionReasonChange(event.target.value)}
              placeholder="Expliquez pourquoi cette inscription est rejetée..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={onReject} disabled={isLoading}>
            <XCircle className="h-4 w-4 mr-2" />
            Rejeter
          </Button>
          <Button onClick={onApprove} disabled={isLoading}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approuver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
