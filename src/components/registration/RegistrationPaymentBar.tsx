import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, Loader2, Lock } from 'lucide-react'
import { formatPrice } from '@/lib/registration'
import type { PricingSummary } from './types'

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

// Sticky bottom bar on both mobile and desktop — keeps the payment CTA
// visible regardless of scroll position, instead of scrolling away in the sidebar.
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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur-sm">
      <div className="mx-auto w-full max-w-5xl">
        {submissionMessage ? (
          <Alert
            variant={submissionMessage.type === 'success' ? 'default' : 'destructive'}
            className="mx-3 mt-2 rounded-md py-2 lg:mx-0"
          >
            {submissionMessage.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription className="text-xs">{submissionMessage.text}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-center gap-3 p-3 lg:justify-end lg:gap-6 lg:px-0">
          <div className="flex-1 lg:flex-none lg:text-right">
            {cartSummaryParts.length > 0 ? (
              <div className="text-xs text-muted-foreground">{cartSummaryParts.join(' · ')}</div>
            ) : (
              <div className="text-xs text-muted-foreground">Total à régler</div>
            )}
            <div className="text-lg font-semibold leading-tight">
              {formatPrice(summaryPricing.totalDue, summaryPricing.currency)}
            </div>
          </div>
          <Button
            size="lg"
            onClick={onPayment}
            disabled={isCreatingPaymentIntent || isAuthPending || !isFormComplete}
            className="lg:min-w-64"
          >
            {isCreatingPaymentIntent ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Préparation du paiement...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Procéder au paiement sécurisé
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
