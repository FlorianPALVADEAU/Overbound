import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, CircleHelp, Loader2, Lock } from 'lucide-react'
import Link from 'next/link'
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
            <div className="group relative mt-1 flex w-fit flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] leading-snug text-muted-foreground lg:ml-auto lg:justify-end">
              <span>Billets non remboursables</span>
              <CircleHelp
                className="h-3.5 w-3.5 cursor-help"
                aria-label="Détail de la politique de remboursement"
                tabIndex={0}
              />
              <Link href="/cgv#annulation-participant" className="underline underline-offset-2 hover:text-foreground">
                Voir les CGV
              </Link>
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-64 rounded-md border bg-popover p-3 text-left text-xs leading-relaxed text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 lg:left-auto lg:right-0"
              >
                Aucun remboursement, avoir ni compensation volontaire n&apos;est accordé, quelle que soit la raison
                invoquée. Les droits impératifs prévus par la loi restent réservés.
              </span>
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
