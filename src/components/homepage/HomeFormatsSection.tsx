'use client'

import { FormatsComparison } from '@/components/events/landing/FormatsComparison'
import { useFeaturedEvent } from '@/app/api/events/featured/featuredEventQueries'
import { isEventOpenForRegistration } from '@/lib/events/registrationStatus'

const findTicketByFormat = (
  tickets: Array<{ id: string; name?: string | null; race?: { type?: string | null; name?: string | null } | null }>,
  format: 'open' | 'ranked',
) =>
  tickets.find((t) => {
    const raceType = String(t.race?.type ?? '').toLowerCase()
    const raceName = String(t.race?.name ?? t.name ?? '').toLowerCase()
    return raceType.includes(format) || raceName.includes(format)
  })

export function HomeFormatsSection() {
  const { data } = useFeaturedEvent()
  const event = data?.event

  if (!event) return null

  const tickets = event.tickets ?? []
  const openTicket = findTicketByFormat(tickets, 'open')
  const rankedTicket = findTicketByFormat(tickets, 'ranked')
  const isOnSale = isEventOpenForRegistration(event) && (data?.availableSpots ?? 0) > 0

  const registerHref = (ticketId?: string) =>
    ticketId ? `/events/${event.slug}/register?ticket=${ticketId}` : `/events/${event.slug}/register`

  return (
    <FormatsComparison
      isOnSale={isOnSale}
      openTicket={openTicket}
      rankedTicket={rankedTicket}
      registerHref={registerHref}
    />
  )
}
