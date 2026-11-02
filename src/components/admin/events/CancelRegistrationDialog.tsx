'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCancelRegistration, type AdminRefundChoice, type EventParticipantRow } from '@/app/api/admin/events/participantsQueries'

type RefundMode = AdminRefundChoice['mode']

const euros = (cents: number, currency: string | null | undefined) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: (currency ?? 'eur').toUpperCase() }).format(cents / 100)

/** Euro text typed by an admin ("12,5" or "12.50") to cents; null when it is not a positive amount. */
export const parseEuroInput = (value: string): number | null => {
  const normalized = value.trim().replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const cents = Math.round(Number(normalized) * 100)
  return cents > 0 ? cents : null
}

interface CancelRegistrationDialogProps {
  participant: EventParticipantRow | null
  onOpenChange: (open: boolean) => void
  onCancelled: (message: string) => void
}

export function CancelRegistrationDialog({ participant, onOpenChange, onCancelled }: CancelRegistrationDialogProps) {
  const cancel = useCancelRegistration()
  const [reason, setReason] = useState('')
  const [mode, setMode] = useState<RefundMode>('none')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (!participant) return
    setReason('')
    setAmount('')
    setMode('none')
    cancel.reset()
    // `cancel` is stable enough for a reset on open; depending on it would reset on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participant?.id])

  if (!participant) return null

  const paid = participant.registration.paidTicketCents ?? 0
  const currency = participant.payment?.currency
  const canRefund = paid > 0 && Boolean(participant.payment)
  const customCents = parseEuroInput(amount)
  const customInvalid = mode === 'custom' && (customCents === null || customCents > paid)
  const reasonInvalid = reason.trim().length < 3
  const disabled = cancel.isPending || reasonInvalid || customInvalid

  const submit = () => {
    const refund: AdminRefundChoice = mode === 'custom' ? { mode, amountCents: customCents ?? 0 } : { mode }
    cancel.mutate(
      { registrationId: participant.id, reason: reason.trim(), refund },
      {
        onSuccess: (result) => {
          onOpenChange(false)
          onCancelled(
            result.refundedCents > 0
              ? `Inscription annulée, ${euros(result.refundedCents, result.currency)} remboursés.`
              : 'Inscription annulée.',
          )
        },
      },
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !cancel.isPending && onOpenChange(open)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" aria-hidden />
            Annuler l’inscription
          </DialogTitle>
          <DialogDescription>
            {participant.participant.name ?? participant.participant.email} · {participant.ticket.name ?? 'Billet'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Le QR code est invalidé, la place en SAS est libérée et les points ambassadeur sont retirés. L’inscription reste
            visible dans la liste avec le statut annulé.
          </p>

          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Motif (visible dans les journaux)</Label>
            <Textarea id="cancel-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={200} rows={2} />
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-1 font-medium">Remboursement</legend>
            <label className="flex items-start gap-2">
              <input type="radio" name="refund-mode" checked={mode === 'none'} onChange={() => setMode('none')} className="mt-1" />
              <span>Aucun remboursement</span>
            </label>
            <label className={`flex items-start gap-2 ${canRefund ? '' : 'opacity-50'}`}>
              <input type="radio" name="refund-mode" disabled={!canRefund} checked={mode === 'ticket'} onChange={() => setMode('ticket')} className="mt-1" />
              <span>Rembourser le billet{canRefund ? ` (${euros(paid, currency)})` : ''}</span>
            </label>
            <label className={`flex items-start gap-2 ${canRefund ? '' : 'opacity-50'}`}>
              <input type="radio" name="refund-mode" disabled={!canRefund} checked={mode === 'custom'} onChange={() => setMode('custom')} className="mt-1" />
              <span>Rembourser un montant</span>
            </label>
            {mode === 'custom' ? (
              <div className="pl-6">
                <Input aria-label="Montant à rembourser en euros" inputMode="decimal" placeholder="Ex. 25,00" value={amount} onChange={(event) => setAmount(event.target.value)} />
                {customInvalid && amount ? (
                  <p className="mt-1 text-xs text-destructive">Entre un montant positif d’au plus {euros(paid, currency)}.</p>
                ) : null}
              </div>
            ) : null}
            {!canRefund ? <p className="text-xs text-muted-foreground">Aucun montant de billet remboursable n’est enregistré (billet gratuit ou ancien paiement). Rembourse depuis Stripe si besoin.</p> : null}
          </fieldset>

          {cancel.error ? (
            <Alert variant="destructive">
              <AlertDescription>{cancel.error.message}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={cancel.isPending}>
            Garder l’inscription
          </Button>
          <Button type="button" variant="destructive" onClick={submit} disabled={disabled}>
            {cancel.isPending ? 'Annulation…' : mode === 'none' ? 'Annuler l’inscription' : 'Annuler et rembourser'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
