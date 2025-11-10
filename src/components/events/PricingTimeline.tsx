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
import { Badge } from '@/components/ui/badge'
import { Ticket } from '@/types/Ticket'

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
        year: 'numeric',
      })
      .toUpperCase()
  }

  // Check if a tier is currently active
  const isActiveTier = (tier: EventPriceTier) => {
    const startTime = tier.available_from ? new Date(tier.available_from).getTime() : 0
    const endTime = tier.available_until ? new Date(tier.available_until).getTime() : Infinity
    const currentTime = now.getTime()
    return currentTime >= startTime && currentTime < endTime
  }

  if (sortedTiers.length === 0) {
    return null
  }

  return (
    <div className="text-black w-full">
      {/* Header with title and next price adjustment */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-black text-xl font-bold">Évolution des tarifs</h3>
        {nextTier && nextTier.available_from && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Prochaine augmentation :</span>
            <Badge variant="destructive" className="font-semibold">
              {formatDate(nextTier.available_from)}
            </Badge>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative py-12">
        {/* Background line (gray) - thicker */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[10px] bg-muted rounded-full" />

        {/* Progress line (colored up to current date) */}
        {(() => {
          if (sortedTiers.length === 0) return null

          const currentTime = now.getTime()

          // Find which tier we're currently in or past
          let progressPercent = 0
          const allPoints = [
            ...sortedTiers.map((tier, index) => ({
              time: tier.available_from ? new Date(tier.available_from).getTime() : 0,
              index: index,
              type: 'tier' as const,
              tierName: tier.name,
            })),
            {
              time: new Date(eventDate).getTime(),
              index: sortedTiers.length,
              type: 'event' as const,
            },
          ].sort((a, b) => a.time - b.time)

          // Find the current position
          for (let i = 0; i < allPoints.length; i++) {
            if (currentTime < allPoints[i].time) {
              // We're between point i-1 and point i
              if (i === 0) {
                progressPercent = 0
              } else {
                const prevPoint = allPoints[i - 1]
                const currentPoint = allPoints[i]
                const segmentDuration = currentPoint.time - prevPoint.time
                const segmentProgress = currentTime - prevPoint.time
                const segmentPercent = segmentProgress / segmentDuration

                // Calculate percentage: (previous segments + current segment progress) / total segments
                const segmentSize = 100 / allPoints.length
                progressPercent = i * segmentSize + segmentPercent * segmentSize
              }
              break
            }
          }

          // If we're past all points
          if (currentTime >= allPoints[allPoints.length - 1].time) {
            progressPercent = 100
          }

          progressPercent = Math.min(Math.max(progressPercent, 0), 100)

          return (
            <div
              className="absolute top-1/2 -translate-y-1/2 left-0 h-[10px] bg-red-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          )
        })()}

        {/* Tier points */}
        <div className="relative flex justify-between items-center">
          {sortedTiers.map((tier, index) => {
            const active = isActiveTier(tier)
            const tierPrice = calculateCurrentPrice(ticket.final_price_cents, tier)

            return (
              <div
                key={tier.id}
                className="flex flex-col items-center relative"
                style={{
                  flex: '1 1 0',
                }}
              >
                {/* Date label - alternating top/bottom */}
                <div className={`absolute -top-10 left-1/2 -translate-x-1/2`}>
                  <div className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {formatDate(tier.available_from)}
                  </div>
                </div>

                {/* Circle point - INSIDE the bar */}
                <div
                  className={`relative z-10 w-[18px] h-[18px] rounded-full border-[3px] shadow-lg ${
                    active
                      ? 'bg-primary border-primary-foreground scale-125 ring-4 ring-primary/30'
                      : 'bg-background border-border'
                  } transition-all duration-300`}
                />

                {/* Price label - alternating bottom/top (opposite of date) */}
                <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2`}>
                  <div
                    className={`text-sm font-bold whitespace-nowrap ${
                      active ? 'text-primary' : 'text-primary/60'
                    }`}
                  >
                    {formatPrice(tierPrice, currency || 'eur')}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Race day marker */}
          <div className="flex flex-col items-center relative flex-[0_0_auto] ml-12">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <div className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                {formatDate(eventDate)}
              </div>
            </div>

            <div className="relative z-10 w-[18px] h-[18px] rounded-full border-[3px] bg-background border-border shadow-lg" />

            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
              <Badge variant="outline" className="font-bold whitespace-nowrap">
                JOUR J
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Current price callout */}
      {(() => {
        const activeTier = sortedTiers.find(isActiveTier)
        if (!activeTier) return null

        const currentPrice = calculateCurrentPrice(ticket.final_price_cents, activeTier)
        const nextPrice = nextTier
          ? calculateCurrentPrice(ticket.final_price_cents, nextTier)
          : null

        return (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg border">
            <div className="flex items-center justify-between">
              {nextTier && nextTier.available_from && nextPrice && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Le prix passera à{' '}
                  <span className="font-semibold">{formatPrice(nextPrice, currency || 'eur')}</span>{' '}
                  le {formatDate(nextTier.available_from)}
                </div>
              )}
              <div className="flex flex-col items-end">
                <span className="text-2xl font-bold text-red-600">
                  {formatPrice(currentPrice, currency || 'eur')}
                </span>
                <span className="text-sm font-medium">Prix actuel :</span>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
