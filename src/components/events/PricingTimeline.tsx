'use client'

import { useMemo } from 'react'
import {
  EventPriceTier,
  sortPriceTiersByDate,
  getNextPriceTier,
  calculateCurrentPrice,
} from '@/types/EventPriceTier'
import { formatPrice } from '@/lib/pricing'
import { Currency } from '@/types/base.type'
import { Ticket } from '@/types/Ticket'

type Color = 'emerald' | 'blue' | 'amber' | 'red'

interface PricingTimelineProps {
  ticket: Ticket
  eventPriceTiers: EventPriceTier[]
  currency: Currency | null
  eventDate: string
}

export function PricingTimeline({
  ticket,
  eventPriceTiers,
  currency,
  eventDate,
}: PricingTimelineProps) {
  const sortedTiers = useMemo(() => sortPriceTiersByDate(eventPriceTiers), [eventPriceTiers])

  const nextTier = useMemo(() => getNextPriceTier(sortedTiers), [sortedTiers])

  const now = useMemo(() => new Date(), [])

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBD'
    const date = new Date(dateString)
    return date
      .toLocaleDateString('fr-FR', {
        month: 'short',
        day: 'numeric',
      })
  }

  // Check if a tier is currently active
  const isActiveTier = (tier: EventPriceTier) => {
    const startTime = tier.available_from ? new Date(tier.available_from).getTime() : 0
    const endTime = tier.available_until ? new Date(tier.available_until).getTime() : Infinity
    const currentTime = now.getTime()
    return currentTime >= startTime && currentTime < endTime
  }

  // Check if a tier is in the future (not yet started)
  const isFutureTier = (tier: EventPriceTier) => {
    const startTime = tier.available_from ? new Date(tier.available_from).getTime() : 0
    return now.getTime() < startTime
  }

  // Get color based on tier index
  const getColor = (index: number, total: number): Color => {
    const colors: Color[] = ['emerald', 'blue', 'amber', 'red']
    if (total <= 4) {
      return colors[index] || 'red'
    }
    // For more than 4 tiers, distribute colors evenly
    const colorIndex = Math.floor((index / (total - 1)) * (colors.length - 1))
    return colors[colorIndex]
  }

  const dotBg: Record<Color, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    red: 'bg-rose-500',
  }

  const textColor: Record<Color, string> = {
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    red: 'text-rose-600',
  }

  // Get active tier index for progress calculation
  const getActiveTierIndex = () => {
    for (let i = 0; i < sortedTiers.length; i++) {
      if (isActiveTier(sortedTiers[i])) return i
    }
    return sortedTiers.length - 1
  }

  if (sortedTiers.length === 0) {
    return null
  }

  const activeTierIndex = getActiveTierIndex()
  const activeTier = sortedTiers.find(isActiveTier)
  const currentPrice = activeTier
    ? calculateCurrentPrice(ticket.final_price_cents, activeTier)
    : null
  const nextPrice = nextTier ? calculateCurrentPrice(ticket.final_price_cents, nextTier) : null

  // Calculate progress percentage
  const totalPoints = sortedTiers.length + 1 // +1 for "Jour J"
  const progressPercent = ((activeTierIndex + 1) / totalPoints) * 100

  return (
    <section className="w-full h-auto">
      {/* En-tête */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold">Évolution des tarifs</h3>
        <p className="text-sm text-muted-foreground">
          Plus tôt tu réserves, plus tu économises. <strong>*</strong>
        </p>
      </div>

      {/* Timeline — Desktop (>= sm) */}
      <div className="relative hidden py-10 sm:block">
        {/* Background line (full length placeholder) */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 rounded-full" />

        {/* Progress line (solid, colored) */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />

        <div className="relative flex items-center justify-between">
          {sortedTiers.map((tier, index) => {
            const color = getColor(index, sortedTiers.length)
            const tierPrice = calculateCurrentPrice(ticket.final_price_cents, tier)
            const active = isActiveTier(tier)
            const future = isFutureTier(tier)

            return (
              <div key={tier.id} className="relative flex flex-1 flex-col items-center">
                {/* Date au-dessus */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-center">
                  <span className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">
                    {tier.available_from ? formatDate(tier.available_from) : "Dès l'ouverture"}
                  </span>
                </div>

                {/* Point */}
                <div className="relative">
                  <div
                    className={`z-10 h-3 w-3 rounded-full ${
                      future ? 'bg-gray-400' : dotBg[color]
                    } ${active ? 'ring-4 ring-gray-300' : ''}`}
                  />
                  {/* Pulse animation for active */}
                  {active && (
                    <div className="absolute inset-0 -m-1 animate-ping rounded-full bg-gray-300 opacity-75" />
                  )}
                </div>

                {/* Nom du palier + prix en dessous */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center">
                  <div className="text-xs font-semibold">{tier.name || `Palier ${index + 1}`}</div>
                  <div className={`text-sm font-bold ${active && !future ? textColor[color] : ''}`}>
                    {formatPrice(tierPrice, currency || 'eur')}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Jour J */}
          <div className="relative flex flex-col items-center flex-[0_0_auto] ml-8">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-center">
              <span className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">
                {formatDate(eventDate)}
              </span>
            </div>

            <div className="z-10 h-3 w-3 rounded-full bg-gray-400" />

            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center">
              <div className="text-xs font-semibold text-muted-foreground">Jour J</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline — Mobile (< sm) */}
      <div className="relative sm:hidden">
        {/* Background line (full length placeholder) */}
        <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-gray-200 rounded-full" />

        {/* Progress line (solid, colored) */}
        <div
          className="absolute left-[7px] top-0 w-0.5 bg-gradient-to-b from-emerald-500 via-blue-500 to-amber-500 rounded-full transition-all duration-500"
          style={{ height: `${progressPercent}%` }}
        />

        <div className="relative flex flex-col">
          {sortedTiers.map((tier, index) => {
            const color = getColor(index, sortedTiers.length)
            const tierPrice = calculateCurrentPrice(ticket.final_price_cents, tier)
            const active = isActiveTier(tier)
            const future = isFutureTier(tier)

            return (
              <div key={tier.id} className="relative pl-8 py-4">
                {/* Point */}
                <span
                  className={`absolute left-1 top-1/2 z-10 h-3 w-3 -translate-y-1/2 rounded-full ${
                    future ? 'bg-gray-400' : dotBg[color]
                  } ${active ? 'ring-2 ring-gray-300 ring-offset-1' : ''}`}
                />
                {/* Pulse animation for active */}
                {active && (
                  <span className="absolute left-0 top-1/2 z-0 h-5 w-5 -translate-y-1/2 animate-ping rounded-full bg-gray-300 opacity-75" />
                )}

                {/* Textes */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold leading-5">
                      {tier.name || `Palier ${index + 1}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tier.available_from ? formatDate(tier.available_from) : "Dès l'ouverture"}
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${active && !future ? textColor[color] : ''}`}>
                    {formatPrice(tierPrice, currency || 'eur')}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Jour J */}
          <div className="relative pl-8 py-4">
            <span className="absolute left-1 top-1/2 z-10 h-3 w-3 -translate-y-1/2 rounded-full bg-gray-400" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold leading-5 text-muted-foreground">Jour J</div>
                <div className="text-xs text-muted-foreground">{formatDate(eventDate)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info prix actuel + prochaine augmentation */}
      <div className="mt-10 flex flex-col gap-1 text-xs text-muted-foreground">
        {activeTier && currentPrice && (
          <div className="flex items-center gap-2">
            <strong>Prix actuel :</strong>
            <span className="font-bold text-foreground">
              {formatPrice(currentPrice, currency || 'eur')}
            </span>
          </div>
        )}
        {nextTier && nextTier.available_from && nextPrice && (
          <div className="flex items-center gap-2">
            <strong>*</strong>
            <span>
              Passera à {formatPrice(nextPrice, currency || 'eur')} le{' '}
              {formatDate(nextTier.available_from)}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
