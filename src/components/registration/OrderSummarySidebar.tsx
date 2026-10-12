import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import type { OrderLine } from '@/lib/checkout/orderLines'
import PromoCodeInput from './PromoCodeInput'
import { OrderLines, OrderTotal, RefundNotice } from './summary'
import type { AppliedPromo } from './types'

interface OrderSummarySidebarProps {
  lines: OrderLine[]
  totalCents: number
  currency: string
  hasFlexible: boolean
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

export default function OrderSummarySidebar({
  lines,
  totalCents,
  currency,
  hasFlexible,
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

      <div className="mt-4">
        <OrderLines lines={lines} currency={currency} />
      </div>

      {pricingNotices.map((notice) => (
        <p key={notice} className="mt-3 text-xs font-medium text-destructive">
          {notice}
        </p>
      ))}

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
