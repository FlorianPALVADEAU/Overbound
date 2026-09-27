'use client'

import { UltraArenaFormats } from './UltraArenaFormats'

interface Ticket {
  id: string
}

interface FormatsComparisonProps {
  isOnSale: boolean
  openTicket?: Ticket | null
  rankedTicket?: Ticket | null
  registerHref: (ticketId?: string) => string
  onOpenClick?: () => void
  onRankedClick?: () => void
  onMidCtaClick?: () => void
}

/**
 * OPEN vs RANKED comparison, shared by the homepage, any event page and
 * /events/formats. Thin wrapper over UltraArenaFormats — same content,
 * named for what it now is (FDR-0015 §4/§9), not tied to one event's name.
 */
export function FormatsComparison({
  isOnSale,
  openTicket,
  rankedTicket,
  registerHref,
  onOpenClick,
  onRankedClick,
  onMidCtaClick,
}: FormatsComparisonProps) {
  return (
    <UltraArenaFormats
      isOnSale={isOnSale}
      openTicket={openTicket}
      rankedTicket={rankedTicket}
      registerHref={registerHref}
      onOpenClick={onOpenClick ?? (() => {})}
      onRankedClick={onRankedClick ?? (() => {})}
      onMidCtaClick={onMidCtaClick}
    />
  )
}
