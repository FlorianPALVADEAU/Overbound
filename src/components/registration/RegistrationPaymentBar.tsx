import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, Loader2, Lock } from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/registration'
import type { PricingSummary } from './types'

interface PayButtonProps {
  isCreatingPaymentIntent: boolean
  isAuthPending?: boolean
  isFormComplete: boolean
  onPayment: () => void
  className?: string
}

/** The single payment action of the checkout, shared by the summary and the mobile bar. */
export function PayButton({
  isCreatingPaymentIntent,
  isAuthPending = false,
  isFormComplete,
  onPayment,
  className,
}: PayButtonProps) {
  return (
    <Button
      size="cta"
      onClick={onPayment}
      disabled={isCreatingPaymentIntent || isAuthPending || !isFormComplete}
      className={className}
    >
      {isCreatingPaymentIntent ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Préparation du paiement...
        </>
      ) : (
        <>
          <Lock className="mr-2 h-4 w-4" />
          Payer en sécurité
        </>
      )}
    </Button>
  )
}

interface RegistrationPaymentBarProps {
  summaryPricing: PricingSummary
  ticketCount: number
  upsellCount: number
  isCreatingPaymentIntent: boolean
  isAuthPending?: boolean
  isFormComplete: boolean
  submissionMessage: { type: 'error' | 'success'; text: string } | null
  onPayment: () => void
}

/** Compact payment bar, mobile only: on desktop the button lives in the sticky summary. */
export default function RegistrationPaymentBar({
  summaryPricing,
  ticketCount,
  upsellCount,
  isCreatingPaymentIntent,
  isAuthPending = false,
  isFormComplete,
  submissionMessage,
  onPayment,
}: RegistrationPaymentBarProps) {
  const cartSummaryParts = [
    ticketCount > 0 ? `${ticketCount} billet${ticketCount > 1 ? 's' : ''}` : null,
    upsellCount > 0 ? `${upsellCount} option${upsellCount > 1 ? 's' : ''}` : null,
  ].filter(Boolean)

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden">
      {submissionMessage ? (
        <Alert
          variant={submissionMessage.type === 'success' ? 'default' : 'destructive'}
          className="mx-3 mt-2 w-auto rounded-md py-2"
        >
          {submissionMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <AlertDescription className="text-xs">{submissionMessage.text}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {cartSummaryParts.length > 0 ? cartSummaryParts.join(' · ') : 'Total'}
          </p>
          <p className="text-lg font-semibold leading-tight">
            {formatPrice(summaryPricing.totalDue, summaryPricing.currency)}
          </p>
          <Link href="/cgv#annulation-participant" className="text-xs text-muted-foreground underline underline-offset-2">
            Billets non remboursables · CGV
          </Link>
        </div>
        <PayButton
          isCreatingPaymentIntent={isCreatingPaymentIntent}
          isAuthPending={isAuthPending}
          isFormComplete={isFormComplete}
          onPayment={onPayment}
        />
      </div>
    </div>
  )
}
