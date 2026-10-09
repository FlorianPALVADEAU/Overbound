'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useFeaturedEvent } from '@/app/api/events/featured/featuredEventQueries'
import { AccountLinkRow } from '@/components/account/AccountLinkRow'
import { AccountDataBoundary, type AuthenticatedAccountData } from '@/components/account/AccountDataBoundary'
import { AccountScreen, AccountSection } from '@/components/account/AccountScreen'
import { GroupHighlight } from '@/components/account/group/GroupHighlight'
import { TransferReturnNotice } from '@/components/account/tickets/TransferReturnNotice'
import { EventTickets } from '@/components/account/tickets/EventTickets'
import { createTicketContext } from '@/components/account/tickets/ticketPresentation'
import { Button } from '@/components/ui/button'
import { formatMonthYear } from '@/lib/account/format'
import { getProfileCompletion } from '@/lib/account/profile'
import { groupTicketsByEvent, pickFeaturedGroup } from '@/lib/account/tickets'

function AccountHomeContent({ user, profile, registrations }: AuthenticatedAccountData) {
  const now = useMemo(() => new Date(), [])
  const context = useMemo(() => createTicketContext(user, profile, now), [user, profile, now])
  const groups = useMemo(() => groupTicketsByEvent(registrations, now, user.email), [registrations, now, user.email])
  const featured = pickFeaturedGroup(groups)
  const pastGroups = groups.filter((group) => group !== featured && group.phase === 'past')
  const completion = getProfileCompletion(profile)

  return (
    <AccountScreen>
      <TransferReturnNotice />

      <div className="space-y-8 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-14 lg:space-y-0">
        <div>{featured ? <EventTickets group={featured} context={context} /> : <NothingToRun hasHistory={groups.length > 0} />}</div>

        <aside className="space-y-8 lg:sticky lg:top-24">
          <GroupHighlight />

          {!completion.isComplete ? (
            <AccountLinkRow
              href="/account/profile"
              title="Complète ton profil"
              detail={`Il manque : ${completion.missing.map((item) => item.label).join(', ')}`}
              emphasis
            />
          ) : null}

          {pastGroups.length > 0 ? (
            <AccountSection
              title="Mes éditions"
              action={
                <Link href="/account/tickets" className="text-xs font-semibold text-primary">
                  Tout voir
                </Link>
              }
            >
              <ul>
                {pastGroups.slice(0, 3).map((past) => (
                  <li key={past.key}>
                    <AccountLinkRow
                      href="/account/tickets"
                      title={past.title}
                      detail={[formatMonthYear(past.date), `${past.tickets.length} dossard${past.tickets.length > 1 ? 's' : ''}`]
                        .filter(Boolean)
                        .join(' · ')}
                    />
                  </li>
                ))}
              </ul>
            </AccountSection>
          ) : null}
        </aside>
      </div>
    </AccountScreen>
  )
}

/** Client entry point: the server page cannot pass a render function across the boundary. */
export function AccountHome() {
  return <AccountDataBoundary>{(data) => <AccountHomeContent {...data} />}</AccountDataBoundary>
}

/** No bib to show: either nothing bought yet, or only finished editions. */
function NothingToRun({ hasHistory }: { hasHistory: boolean }) {
  const { data } = useFeaturedEvent()
  const next = data?.event ?? null

  return (
    <div className="space-y-5 py-6">
      <h1 className="text-balance text-[2.5rem] font-black leading-[0.95] tracking-tight md:text-5xl">
        {hasHistory ? 'Pas de départ en vue.' : 'Pas encore de dossard.'}
      </h1>
      <p className="max-w-md text-muted-foreground">
        {next
          ? `${next.title} ouvre ses portes. Ton billet apparaîtra ici, prêt à scanner.`
          : "Dès que tu t'inscris à une course, ton billet apparaît ici, prêt à scanner."}
      </p>
      {next ? (
        <Button asChild className="h-12 px-6 text-base font-bold">
          <Link href={`/events/${next.slug ?? next.id}`}>Voir {next.title}</Link>
        </Button>
      ) : null}
    </div>
  )
}
