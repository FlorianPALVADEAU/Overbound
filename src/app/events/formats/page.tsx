'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
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

export default function FormatsPage() {
  const { data, isLoading } = useFeaturedEvent()
  const event = data?.event

  const tickets = event?.tickets ?? []
  const openTicket = findTicketByFormat(tickets, 'open')
  const rankedTicket = findTicketByFormat(tickets, 'ranked')
  const isOnSale = !!event && isEventOpenForRegistration(event) && (data?.availableSpots ?? 0) > 0

  const registerHref = (ticketId?: string) =>
    event
      ? ticketId
        ? `/events/${event.slug}/register?ticket=${ticketId}`
        : `/events/${event.slug}/register`
      : '/events'

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <section className="w-full px-4 py-16 sm:px-6 sm:py-20 xl:px-32">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.28em] text-primary">
            Deux façons de courir
          </span>
          <h1 className="mt-4 text-balance text-4xl font-black tracking-tight sm:text-5xl">
            OPEN ou RANKED, lequel te correspond ?
          </h1>
          <p className="mt-4 text-pretty text-muted-foreground">
            Même parcours, même obstacles. Le format change ta façon de courir : à ton rythme sur
            un créneau choisi, ou en compétition sur un départ unique et classé.
          </p>
        </div>
      </section>

      {!isLoading && !event ? (
        <section className="w-full px-4 pb-20 sm:px-6 xl:px-32">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-muted-foreground">
              Aucun événement ouvert à l&apos;inscription pour le moment.
            </p>
            <Button asChild className="mt-4">
              <Link href="/">Retour à l&apos;accueil</Link>
            </Button>
          </div>
        </section>
      ) : (
        <FormatsComparison
          isOnSale={isOnSale}
          openTicket={openTicket}
          rankedTicket={rankedTicket}
          registerHref={registerHref}
        />
      )}
    </main>
  )
}
