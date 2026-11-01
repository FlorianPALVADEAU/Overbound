'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { useFeaturedEvent } from '@/app/api/events/featured/featuredEventQueries'
import { isEventOpenForRegistration } from '@/lib/events/registrationStatus'
import { tshirtHeadline } from '@/lib/tshirtOffer'
import { containerClass } from '@/components/ds'
import { cn } from '@/lib/utils'

const DISMISS_KEY = 'tshirt-offer-bar-dismissed'
// Where the bar would only get in the way: the checkout itself (it has its own card) and tool areas.
const HIDDEN_PREFIXES = ['/dashboard', '/admin', '/account', '/auth']

const isHiddenPath = (pathname: string) =>
  HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || /^\/events\/[^/]+\/(register|success)/.test(pathname)

const readDismissed = () => {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/** Site-wide announcement of the T-shirt offer with the live stock. Dismissible for the session. */
export function TshirtOfferBar() {
  const pathname = usePathname() ?? ''
  const { data } = useFeaturedEvent()
  const [dismissed, setDismissed] = useState(readDismissed)

  const event = data?.event
  const offer = data?.tshirtOffer
  const headline = offer ? tshirtHeadline(offer) : null
  if (dismissed || !event || !headline || !isEventOpenForRegistration(event) || isHiddenPath(pathname)) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Private mode: the bar simply returns on the next page load.
    }
  }

  return (
    <div className="relative bg-primary text-primary-foreground" role="region" aria-label="Offre T-shirt">
      <div className={cn(containerClass(), 'py-2 pr-10 text-center')}>
        <p className="text-sm font-semibold">
          {headline}
          <Link
            href={`/events/${event.slug}/register`}
            className="ml-2 underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
          >
            Je m’inscris
          </Link>
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fermer l’annonce"
        className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full outline-none hover:bg-primary-foreground/10 focus-visible:ring-2 focus-visible:ring-primary-foreground"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  )
}
