'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { formatLongDate, formatPrice } from '@/lib/account/format'
import type { AccountRegistrationItem } from '@/types/AccountRegistration'

interface FlexibleCancelDialogProps {
  ticket: AccountRegistrationItem | null
  pending: boolean
  error: string | null
  onConfirm: () => void
  onClose: () => void
}

/** Last step before cancelling a flexible bib: what is refunded, what is not, and that it is final. */
export function FlexibleCancelDialog({ ticket, pending, error, onConfirm, onClose }: FlexibleCancelDialogProps) {
  const amount = formatPrice(ticket?.flexible_refund_amount_cents ?? null, ticket?.currency ?? 'eur')
  const deadline = formatLongDate(ticket?.flexible_refund_deadline ?? null)

  return (
    <Dialog open={ticket !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>Te faire rembourser ce billet ?</DialogTitle>
        <DialogDescription>
          {ticket?.ticket_name ?? 'Billet'} · {ticket?.event_title ?? 'Overbound'}
        </DialogDescription>
        <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            <strong className="text-foreground">{amount}</strong> remboursés sur le moyen de paiement de l&apos;achat.
          </li>
          <li>Les frais de l&apos;option billet flexible et les autres options ne sont pas remboursés.</li>
          <li>Le billet est annulé définitivement : le dossard et son QR code sont supprimés.</li>
          {deadline ? <li>Remboursement possible jusqu&apos;au {deadline}.</li> : null}
        </ul>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="grid gap-2 pt-2 sm:grid-cols-2">
          <Button variant="outline" className="h-11" onClick={onClose} disabled={pending}>
            Garder mon billet
          </Button>
          <Button variant="destructive" className="h-11 font-bold" onClick={onConfirm} disabled={pending}>
            {pending ? 'Remboursement…' : `Confirmer le remboursement de ${amount}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
