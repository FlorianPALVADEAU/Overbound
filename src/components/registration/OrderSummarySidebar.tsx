import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { calculateCurrentPrice } from '@/types/EventPriceTier'
import type { EventPriceTier } from '@/types/EventPriceTier'
import { FORMAT_LEVELS } from '@/constants/formatLevels'
import { formatPrice, joinName } from '@/lib/registration'
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
}: OrderSummarySidebarProps) {
  const showActiveTierDiscount = hasActiveDiscount && !isTierDiscountOverriddenByPromo

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Résumé de la commande</CardTitle>
        <CardDescription>Mettez à jour vos choix pour ajuster le total.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <PromoCodeInput
          appliedPromos={appliedPromos}
          promoInput={promoInput}
          error={promoError}
          onInputChange={onPromoInputChange}
          onValidate={onValidatePromo}
          onRemove={onRemovePromo}
        />

        <Separator />

        <div className="space-y-2">
          <div className="text-xs uppercase text-muted-foreground">Billets</div>
          {selectedTicketSlots.length === 0 ? (
            <p className="text-muted-foreground">Aucun billet sélectionné.</p>
          ) : (
            selectedTicketSlots.map((ticketId, index) => {
              const ticket = ticketMap[ticketId]
              const participant = participants[index]
              if (!ticket) return null

              const ticketPrice =
                activeTier && ticket.final_price_cents
                  ? calculateCurrentPrice(ticket.final_price_cents, activeTier)
                  : ticket.final_price_cents

              const isUniversalRace = ticket?.race?.is_universal ?? true
              const difficultyLevel = participant?.difficultyLevel
              const difficultyConfig = difficultyLevel ? FORMAT_LEVELS[difficultyLevel] : null

              return (
                <div key={`${ticketId}-${index}`} className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-medium">{ticket.name}</p>
                    {participant?.firstName || participant?.lastName ? (
                      <p className="text-xs text-muted-foreground">
                        {joinName(participant.firstName, participant.lastName)}
                      </p>
                    ) : null}
                    {!isUniversalRace && difficultyConfig && (
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={`text-xs ${difficultyConfig.badgeClass}`}>
                          {difficultyConfig.name}
                        </Badge>
                      </div>
                    )}
                    {showActiveTierDiscount && activeTier && ticket.final_price_cents && (
                      <p className="text-xs text-green-600 font-semibold">
                        -{activeTier.discount_percentage}% ({activeTier.name})
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    {showActiveTierDiscount && ticket.final_price_cents && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(
                          ticket.final_price_cents,
                          (ticket.currency || defaultCurrency).toLowerCase(),
                        )}
                      </span>
                    )}
                    <span className="font-medium">
                      {ticketPrice
                        ? formatPrice(ticketPrice, (ticket.currency || defaultCurrency).toLowerCase())
                        : '—'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-xs uppercase text-muted-foreground">Options</div>
          {upsellSummaryItems.length === 0 ? (
            <p className="text-muted-foreground">Aucune option ajoutée.</p>
          ) : (
            upsellSummaryItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-medium">
                    {item.quantity} × {item.label}
                  </p>
                  {item.details.map((detail, i) => (
                    <p key={`${item.id}-detail-${i}`} className="text-xs text-muted-foreground">
                      {detail}
                    </p>
                  ))}
                </div>
                <span className="font-medium">{formatPrice(item.amount, item.currency)}</span>
              </div>
            ))
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Sous-total billets</span>
            <span>{formatPrice(summaryPricing.ticketTotal, summaryPricing.currency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Options</span>
            <span>{formatPrice(summaryPricing.upsellTotal, summaryPricing.currency)}</span>
          </div>
          {summaryPricing.discountAmount > 0 ? (
            <div className="flex items-center justify-between text-sm text-emerald-600">
              <span>Réduction</span>
              <span>- {formatPrice(summaryPricing.discountAmount, summaryPricing.currency)}</span>
            </div>
          ) : null}
          <Separator />
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total à régler</span>
            <span>{formatPrice(summaryPricing.totalDue, summaryPricing.currency)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
