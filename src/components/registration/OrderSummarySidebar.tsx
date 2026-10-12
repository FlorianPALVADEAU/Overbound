import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { calculateCurrentPrice } from '@/types/EventPriceTier'
import type { EventPriceTier } from '@/types/EventPriceTier'
import { formatPrice, joinName } from '@/lib/registration'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import type {
  AppliedPromo,
  EventTicket,
  Participant,
  PricingSummary,
  UpsellSummaryItem,
} from './types'
import PromoCodeInput from './PromoCodeInput'

interface OrderSummarySidebarProps {
  selectedTicketSlots: string[]
  ticketMap: Record<string, EventTicket>
  participants: Participant[]
  defaultCurrency: string
  activeTier: EventPriceTier | null
  hasActiveDiscount: boolean
  isTierDiscountOverriddenByPromo: boolean
  upsellSummaryItems: UpsellSummaryItem[]
  summaryPricing: PricingSummary
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
  selectedTicketSlots,
  ticketMap,
  participants,
  defaultCurrency,
  activeTier,
  hasActiveDiscount,
  isTierDiscountOverriddenByPromo,
  upsellSummaryItems,
  summaryPricing,
  appliedPromos,
  promoInput,
  promoError,
  onPromoInputChange,
  onValidatePromo,
  onRemovePromo,
  submissionMessage,
  payAction,
}: OrderSummarySidebarProps) {
  const showActiveTierDiscount = hasActiveDiscount && !isTierDiscountOverriddenByPromo
  const row = 'flex items-start justify-between gap-3'

  // Same ticket bought several times reads as one line: "7 × OPEN", not seven.
  const ticketGroups = selectedTicketSlots.reduce<Array<{ ticket: EventTicket; count: number; names: string[] }>>(
    (groups, ticketId, index) => {
      const ticket = ticketMap[ticketId]
      if (!ticket) return groups
      const participant = participants[index]
      const name = participant ? joinName(participant.firstName, participant.lastName) : ''
      const existing = groups.find((group) => group.ticket.id === ticket.id)
      if (existing) {
        existing.count += 1
        if (name) existing.names.push(name)
      } else {
        groups.push({ ticket, count: 1, names: name ? [name] : [] })
      }
      return groups
    },
    [],
  )

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Ta commande</h2>

      <div className="mt-4 space-y-3 text-sm">
        {selectedTicketSlots.length === 0 ? (
          <p className="text-muted-foreground">Choisis un billet pour commencer.</p>
        ) : (
          ticketGroups.map((group) => {
            const { ticket, count, names } = group
            const unit =
              activeTier && ticket.final_price_cents
                ? calculateCurrentPrice(ticket.final_price_cents, activeTier)
                : ticket.final_price_cents
            const currency = (ticket.currency || defaultCurrency).toLowerCase()
            const shown = names.slice(0, 3).join(', ')
            const hidden = names.length - 3

            return (
              <div key={ticket.id} className={row}>
                <div className="min-w-0">
                  <p className="font-medium">
                    {count > 1 ? `${count} × ` : ''}
                    {ticket.name}
                  </p>
                  {names.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {shown}
                      {hidden > 0 ? ` et ${hidden} autre${hidden > 1 ? 's' : ''}` : ''}
                    </p>
                  ) : null}
                  {showActiveTierDiscount && activeTier && ticket.final_price_cents ? (
                    <p className="text-xs font-semibold text-primary">
                      -{activeTier.discount_percentage}% ({activeTier.name})
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  {showActiveTierDiscount && ticket.final_price_cents ? (
                    <p className="text-xs text-muted-foreground line-through">{formatPrice(ticket.final_price_cents * count, currency)}</p>
                  ) : null}
                  <p className="font-medium">{unit ? formatPrice(unit * count, currency) : '—'}</p>
                </div>
              </div>
            )
          })
        )}

        {upsellSummaryItems.map((item) => (
          <div key={item.id} className={row}>
            <div className="min-w-0">
              <p className="font-medium">
                {item.quantity > 1 ? `${item.quantity} × ` : ''}
                {item.label}
              </p>
              {item.details.map((detail, i) => (
                <p key={`${item.id}-detail-${i}`} className="text-xs text-muted-foreground">
                  {detail}
                </p>
              ))}
            </div>
            <p className="font-medium">{formatPrice(item.amount, item.currency)}</p>
          </div>
        ))}

        {summaryPricing.flexibleTotal ? (
          <div className={row}>
            <p>Billet flexible</p>
            <p className="font-medium">{formatPrice(summaryPricing.flexibleTotal, summaryPricing.currency)}</p>
          </div>
        ) : null}

        {summaryPricing.discountAmount > 0 ? (
          <div className={`${row} text-primary`}>
            <p className="font-medium">
              {appliedPromos.length > 0 ? appliedPromos.map((p) => p.code).join(' + ') : 'Réduction'}
            </p>
            <p className="font-medium">- {formatPrice(summaryPricing.discountAmount, summaryPricing.currency)}</p>
          </div>
        ) : null}
      </div>

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

      <div className="flex items-baseline justify-between">
        <span className="text-base font-semibold">Total</span>
        <span className="text-2xl font-bold">{formatPrice(summaryPricing.totalDue, summaryPricing.currency)}</span>
      </div>

      {submissionMessage ? (
        <Alert className="mt-4" variant={submissionMessage.type === 'success' ? 'default' : 'destructive'}>
          {submissionMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <AlertDescription>{submissionMessage.text}</AlertDescription>
        </Alert>
      ) : null}

      {payAction ? (
        <div className="mt-4 hidden space-y-2 lg:block">
          {payAction}
          <p className="text-center text-xs text-muted-foreground">
            Billets non remboursables à ton initiative ·{' '}
            <a href="/cgv#annulation-participant" className="underline underline-offset-2 hover:text-foreground">
              CGV
            </a>
          </p>
        </div>
      ) : null}
    </div>
  )
}
