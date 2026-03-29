'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  EventPriceTier,
  sortPriceTiersByDate,
  calculateCurrentPrice,
  parseTierDate,
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

type TimelineSegment = {
  id: string
  name: string
  start: number
  end: number
  priceCents: number
  sourceTier: EventPriceTier | null
}

export function PricingTimeline({
  ticket,
  eventPriceTiers,
  currency,
  eventDate,
}: PricingTimelineProps) {
  const sortedTiers = useMemo(() => sortPriceTiersByDate(eventPriceTiers), [eventPriceTiers])

  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBD'
    const date = parseTierDate(dateString)
    if (!date) return 'TBD'
    return date
      .toLocaleDateString('fr-FR', {
        month: 'short',
        day: 'numeric',
        timeZone: 'Europe/Paris',
      })
  }

  const formatDateFromTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      timeZone: 'Europe/Paris',
    })
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
    emerald: 'bg-primary',
    blue: 'bg-primary/85',
    amber: 'bg-primary/70',
    red: 'bg-primary/55',
  }

  const textColor: Record<Color, string> = {
    emerald: 'text-primary',
    blue: 'text-primary',
    amber: 'text-primary',
    red: 'text-primary',
  }

  if (sortedTiers.length === 0) {
    return null
  }

  const eventTimestamp = parseTierDate(eventDate)?.getTime() ?? new Date(eventDate).getTime()
  const firstOpeningTimestamp = parseTierDate(sortedTiers[0]?.available_from ?? null)?.getTime()
  if (!firstOpeningTimestamp || eventTimestamp <= firstOpeningTimestamp) {
    return null
  }

  const timelineRange = Math.max(eventTimestamp - firstOpeningTimestamp, 1)
  const toTimelinePercent = (timestamp: number) =>
    Math.min(100, Math.max(0, ((timestamp - firstOpeningTimestamp) / timelineRange) * 100))
  const EDGE_PADDING_PERCENT = 2
  const toVisualPercent = (percent: number) =>
    EDGE_PADDING_PERCENT + (percent / 100) * (100 - EDGE_PADDING_PERCENT * 2)

  const tierStarts = sortedTiers
    .map((tier) => {
      const start = parseTierDate(tier.available_from)?.getTime()
      return start ? { tier, start } : null
    })
    .filter((entry): entry is { tier: EventPriceTier; start: number } => entry !== null)
    .sort((a, b) => a.start - b.start)

  if (tierStarts.length === 0) {
    return null
  }

  const standardStart =
    parseTierDate(sortedTiers[sortedTiers.length - 1]?.available_until ?? null)?.getTime() ??
    eventTimestamp

  const explicitSegments: TimelineSegment[] = tierStarts.map((entry, index) => {
    const nextStart = tierStarts[index + 1]?.start
    const explicitEnd = parseTierDate(entry.tier.available_until)?.getTime()
    const end = Math.min(nextStart ?? explicitEnd ?? eventTimestamp, eventTimestamp)
    return {
      id: entry.tier.id,
      name: entry.tier.name || `Palier ${index + 1}`,
      start: entry.start,
      end: Math.max(end, entry.start),
      priceCents: calculateCurrentPrice(ticket.final_price_cents, entry.tier),
      sourceTier: entry.tier,
    }
  })

  const segments: TimelineSegment[] = [...explicitSegments]
  if (standardStart < eventTimestamp) {
    segments.push({
      id: 'standard',
      name: 'Standard',
      start: standardStart,
      end: eventTimestamp,
      priceCents: ticket.final_price_cents,
      sourceTier: null,
    })
  }

  const sortedSegments = segments
    .filter((segment) => segment.end > segment.start)
    .sort((a, b) => a.start - b.start)

  const activeSegment =
    sortedSegments.find((segment) => now.getTime() >= segment.start && now.getTime() < segment.end) ??
    null
  const nextSegment =
    sortedSegments.find((segment) => segment.start > now.getTime()) ?? null

  const currentPrice = activeSegment?.priceCents ?? ticket.final_price_cents
  const nextPrice = nextSegment?.priceCents ?? null

  const progressPercent = toTimelinePercent(now.getTime())
  const visualProgressPercent = toVisualPercent(progressPercent)

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
        {/* Background line */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-primary/20" />

        {/* Progress line */}
        <div
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-linear-to-r from-[#20bf55] via-[#1ea54a] to-[#187c37] transition-all duration-500"
          style={{ width: `${visualProgressPercent}%` }}
        />

        <div className="relative h-24">
          {sortedSegments.map((segment, index) => {
            const color = getColor(index, Math.max(sortedSegments.length, 1))
            const active = now.getTime() >= segment.start && now.getTime() < segment.end
            const future = now.getTime() < segment.start
            const percent = toTimelinePercent(segment.start)

            return (
              <div
                key={segment.id}
                className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${toVisualPercent(percent)}%` }}
              >
                {/* Date au-dessus */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-center">
                  <span className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">
                    {formatDateFromTime(segment.start)}
                  </span>
                </div>

                {/* Point */}
                <div className="relative flex justify-center">
                  <div
                    className={`z-10 h-3 w-3 rounded-full ${
                      future ? 'bg-primary/30' : dotBg[color]
                    } ${active ? 'ring-4 ring-primary/30' : ''}`}
                  />
                  {active && (
                    <div className="absolute inset-0 -m-1 animate-ping rounded-full bg-primary/25 opacity-75" />
                  )}
                </div>

                {/* Nom du palier + prix en dessous */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                  <div className="text-xs font-semibold">{segment.name}</div>
                  <div className={`text-sm font-bold ${active && !future ? textColor[color] : 'text-muted-foreground'}`}>
                    {formatPrice(segment.priceCents, currency || 'eur')}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Jour J */}
          <div
            className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${toVisualPercent(100)}%` }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-center">
              <span className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">
                {formatDate(eventDate)}
              </span>
            </div>

            <div className="z-10 h-3 w-3 rounded-full bg-primary/35" />

            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
              <div className="text-xs font-semibold text-muted-foreground">Jour J</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline — Mobile (< sm) */}
      <div className="relative sm:hidden">
        <div className="relative h-[340px]">
          {/* Background line */}
          <div className="absolute bottom-3 left-2 top-3 w-0.5 rounded-full bg-primary/20" />

          {/* Progress line */}
          <div
            className="absolute left-2 top-3 w-0.5 rounded-full bg-linear-to-b from-[#20bf55] via-[#1ea54a] to-[#187c37] transition-all duration-500"
            style={{ height: `calc(${visualProgressPercent}% - 6px)` }}
          />

          {sortedSegments.map((segment, index) => {
            const color = getColor(index, Math.max(sortedSegments.length, 1))
            const active = now.getTime() >= segment.start && now.getTime() < segment.end
            const future = now.getTime() < segment.start
            const topPercent = toVisualPercent(toTimelinePercent(segment.start))

            return (
              <div
                key={segment.id}
                className="absolute left-0 right-0 -translate-y-1/2 pl-8 pr-1"
                style={{ top: `${topPercent}%` }}
              >
                <span
                  className={`absolute left-[3px] top-1/2 z-10 h-3 w-3 -translate-y-1/2 rounded-full ${
                    future ? 'bg-primary/30' : dotBg[color]
                  } ${active ? 'ring-2 ring-primary/30 ring-offset-1 ring-offset-card' : ''}`}
                />
                {active && (
                  <span className="absolute left-[0px] top-1/2 z-0 h-5 w-5 -translate-y-1/2 animate-ping rounded-full bg-primary/25 opacity-75" />
                )}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold leading-5">{segment.name}</div>
                    <div className="text-xs text-muted-foreground">{formatDateFromTime(segment.start)}</div>
                  </div>
                  <div className={`text-sm font-bold ${active && !future ? textColor[color] : 'text-muted-foreground'}`}>
                    {formatPrice(segment.priceCents, currency || 'eur')}
                  </div>
                </div>
              </div>
            )
          })}

          <div
            className="absolute left-0 right-0 -translate-y-1/2 pl-8 pr-1"
            style={{ top: `${toVisualPercent(100)}%` }}
          >
            <span className="absolute left-[3px] top-1/2 z-10 h-3 w-3 -translate-y-1/2 rounded-full bg-primary/35" />
            <div className="flex items-center justify-between gap-3">
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
        {currentPrice && (
          <div className="flex items-center gap-2">
            <strong>Prix actuel :</strong>
            <span className="font-bold text-foreground">
              {formatPrice(currentPrice, currency || 'eur')}
            </span>
          </div>
        )}
        {nextSegment && nextPrice && (
          <div className="flex items-center gap-2">
            <strong>*</strong>
            <span>
              Passera à {formatPrice(nextPrice, currency || 'eur')} le{' '}
              {formatDateFromTime(nextSegment.start)}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
