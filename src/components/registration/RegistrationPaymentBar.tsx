import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle, ChevronUp, Loader2, Lock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatPrice } from '@/lib/registration'
import { RefundNotice } from './summary'

interface PayButtonProps {
  isBusy: boolean
  onPayment: () => void
  className?: string
}

/**
 * The single payment action of the checkout, shared by the summary and the
 * mobile bar. Never disabled for a missing field: a click shows what is missing.
 */
export function PayButton({ isBusy, onPayment, className }: PayButtonProps) {
  return (
    <Button size="cta" onClick={onPayment} disabled={isBusy} aria-busy={isBusy} className={className}>
      {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Lock className="mr-2 h-4 w-4" aria-hidden />}
      {isBusy ? 'Préparation du paiement…' : 'Payer en sécurité'}
    </Button>
  )
}

interface RegistrationPaymentBarProps {
  totalCents: number
  currency: string
  ticketCount: number
  upsellCount: number
  hasFlexible: boolean
  isBusy: boolean
  submissionMessage: { type: 'error' | 'success'; text: string } | null
  onPayment: () => void
  /** Full order, opened by a tap on the total. */
  detail?: ReactNode
}

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`

/** Compact payment bar, mobile only: on desktop the button lives in the sticky summary. */
export default function RegistrationPaymentBar({
  totalCents,
  currency,
  ticketCount,
  upsellCount,
  hasFlexible,
  isBusy,
  submissionMessage,
  onPayment,
  detail,
}: RegistrationPaymentBarProps) {
  const cart = [ticketCount > 0 ? plural(ticketCount, 'billet') : null, upsellCount > 0 ? plural(upsellCount, 'option') : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden">
      {submissionMessage ? (
        <Alert variant={submissionMessage.type === 'success' ? 'default' : 'destructive'} className="mx-3 mt-2 w-auto rounded-md py-2">
          {submissionMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <AlertDescription className="text-xs">{submissionMessage.text}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          {detail ? (
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="flex min-h-11 max-w-full flex-col items-start rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Voir le détail de la commande, total ${formatPrice(totalCents, currency)}`}
                >
                  <span className="text-xs text-muted-foreground">{cart || 'Total'}</span>
                  <span className="flex items-center gap-1 text-lg font-semibold leading-tight">
                    {formatPrice(totalCents, currency)}
                    <ChevronUp aria-hidden className="hidden size-4 text-primary min-[360px]:block" />
                  </span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-h-[85dvh] overflow-y-auto">
                <DialogTitle>Ta commande</DialogTitle>
                <DialogDescription className="sr-only">Détail des billets, options et réductions.</DialogDescription>
                {detail}
                <div className="flex items-baseline justify-between border-t border-border pt-3">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold">{formatPrice(totalCents, currency)}</span>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{cart || 'Total'}</p>
              <p className="text-lg font-semibold leading-tight">{formatPrice(totalCents, currency)}</p>
            </>
          )}
          <RefundNotice hasFlexible={hasFlexible} className="line-clamp-2" />
        </div>
        <PayButton isBusy={isBusy} onPayment={onPayment} />
      </div>
    </div>
  )
}
