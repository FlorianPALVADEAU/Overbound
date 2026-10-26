import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import type { OrderLine } from '@/lib/checkout/orderLines'
import PromoCodeInput from './PromoCodeInput'
import { OrderDetailsToggle, OrderLines, OrderTotal, RefundNotice } from './summary'
import type { AppliedPromo } from './types'

interface OrderSummarySidebarProps {
  lines: OrderLine[]
  totalCents: number
  currency: string
  hasFlexible: boolean
  ticketCount: number
  upsellCount: number
  /** Percentage of the group discount when it applies to the order. */
  groupDiscountPercent: number | null
  /** Why the order cannot be priced or a code was left out, in the visitor's words. */
  pricingNotices: string[]
  appliedPromos: AppliedPromo[]
  promoInput: string
  promoError: string | null
  onPromoInputChange: (value: string) => void
  onValidatePromo: () => void
  onRemovePromo: (code: string) => void
  submissionMessage: { type: 'error' | 'success'; text: string } | null
  /** Payment button, rendered under the total so it stays in view while the page scrolls. */
  payAction?: ReactNode
}

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`

export default function OrderSummarySidebar({
  lines,
  totalCents,
  currency,
  hasFlexible,
  ticketCount,
  upsellCount,
  groupDiscountPercent,
  pricingNotices,
  appliedPromos,
  promoInput,
  promoError,
  onPromoInputChange,
  onValidatePromo,
  onRemovePromo,
  submissionMessage,
  payAction,
}: OrderSummarySidebarProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Ta commande</h2>

      {lines.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Choisis un billet pour commencer.</p>
      ) : (
        <div className="mt-3 space-y-1">
          <p className="text-sm text-muted-foreground">
            {plural(ticketCount, 'billet')}
            {upsellCount > 0 ? ` · ${plural(upsellCount, 'option')}` : ''}
          </p>
          {groupDiscountPercent ? (
            <p className="text-sm font-medium text-primary">Remise groupe −{groupDiscountPercent} % appliquée</p>
          ) : null}
        </div>
      )}

      {pricingNotices.map((notice) => (
        <p key={notice} className="mt-3 text-xs font-medium text-destructive">
          {notice}
        </p>
      ))}

      {lines.length > 0 ? (
        <div className="mt-3">
          <OrderDetailsToggle lineCount={lines.length}>
            <OrderLines lines={lines} currency={currency} />
          </OrderDetailsToggle>
        </div>
      ) : null}

      <Separator className="my-4" />
      <PromoCodeInput
        appliedPromos={appliedPromos}
        promoInput={promoInput}
        error={promoError}
        onInputChange={onPromoInputChange}
        onValidate={onValidatePromo}
        onRemove={onRemovePromo}
      />
      <Separator className="my-4" />

      <OrderTotal totalCents={totalCents} currency={currency} />

      {submissionMessage ? (
        <Alert className="mt-4" variant={submissionMessage.type === 'success' ? 'default' : 'destructive'}>
          {submissionMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <AlertDescription>{submissionMessage.text}</AlertDescription>
        </Alert>
      ) : null}

      {payAction ? (
        <div className="mt-4 hidden space-y-2 lg:block">
          {payAction}
          <RefundNotice hasFlexible={hasFlexible} className="text-center" />
        </div>
      ) : null}
    </div>
  )
}
