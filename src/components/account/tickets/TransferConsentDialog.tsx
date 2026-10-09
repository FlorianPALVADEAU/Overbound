'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { TICKET_TRANSFER_FEE_CENTS, formatTransferFee } from '@/lib/tickets/transferPolicy'
import type { AccountRegistrationItem } from '@/types/AccountRegistration'

interface TransferConsentDialogProps {
  ticket: AccountRegistrationItem | null
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Shown before paying the transfer fee: the terms of the hand-over (CGV art. 8)
 * and the express waiver of withdrawal for a service performed immediately.
 */
export function TransferConsentDialog({ ticket, onConfirm, onCancel }: TransferConsentDialogProps) {
  const [accepted, setAccepted] = useState(false)
  const [waived, setWaived] = useState(false)
  const fee = formatTransferFee(TICKET_TRANSFER_FEE_CENTS)

  const close = () => {
    setAccepted(false)
    setWaived(false)
    onCancel()
  }

  return (
    <Dialog open={ticket !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogTitle>Transférer ce dossard</DialogTitle>
        <DialogDescription>
          Frais de transfert : <strong className="text-foreground">{fee}</strong>, payés une fois.
        </DialogDescription>

        <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>La personne qui reçoit le lien remplit son identité et signe elle-même la décharge.</li>
          <li>Dès qu&apos;elle a signé, elle devient seule titulaire : ton QR code ne fonctionne plus.</li>
          <li>Transfert possible jusqu&apos;à la veille de l&apos;événement, une seule fois par dossard.</li>
          <li>Revente au-dessus du prix payé interdite : un dossard revendu peut être annulé.</li>
          <li>
            Si Overbound annule l&apos;événement, le remboursement est versé à l&apos;acheteur d&apos;origine. Les frais de
            transfert ne sont pas remboursés.
          </li>
        </ul>

        <div className="space-y-3 pt-1">
          <div className="flex items-start gap-3">
            <Checkbox id="transfer-terms" checked={accepted} onCheckedChange={(checked) => setAccepted(checked === true)} />
            <Label htmlFor="transfer-terms" className="text-sm font-normal leading-relaxed">
              J&apos;accepte les conditions du transfert (
              <a href="/cgv#transfert" target="_blank" rel="noreferrer" className="underline underline-offset-2">
                CGV, article 8
              </a>
              ).
            </Label>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox id="transfer-waiver" checked={waived} onCheckedChange={(checked) => setWaived(checked === true)} />
            <Label htmlFor="transfer-waiver" className="text-sm font-normal leading-relaxed">
              Je demande que le transfert soit activé dès le paiement et je renonce à mon droit de rétractation pour ces
              frais.
            </Label>
          </div>
        </div>

        <div className="grid gap-2 pt-2 sm:grid-cols-2">
          <Button variant="outline" className="h-11" onClick={close}>
            Annuler
          </Button>
          <Button
            className="h-11 font-bold"
            disabled={!accepted || !waived}
            onClick={() => {
              setAccepted(false)
              setWaived(false)
              onConfirm()
            }}
          >
            Payer {fee}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
