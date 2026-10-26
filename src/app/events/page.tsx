import { ogImageUrl } from '@/lib/seo/ogImage'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { loadFeaturedEvent } from '@/lib/events/loadFeaturedEvent'
import { loadLastEvent } from '@/lib/events/loadLastEvent'
import { NextEditionTeaser } from '@/components/events/NextEditionTeaser'
import { NEXT_EDITION } from '@/lib/seo/siteFacts'

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com').replace(/\/$/, '')

export const metadata: Metadata = {
  title: { absolute: 'Prochaine édition | Overbound Race' },
  description:
    `Overbound, la course à obstacles en boucles de 2 km : revis l'édition 2026 et sois prévenu·e dès l'ouverture de la prochaine, ${NEXT_EDITION.window}.`,
  alternates: { canonical: `${siteUrl}/events` },
  openGraph: {
    title: 'Prochaine édition | Overbound Race',
    description: "Sois prévenu·e en premier de l'ouverture de la prochaine édition d'Overbound.",
    url: `${siteUrl}/events`,
    siteName: 'Overbound Race',
    images: [{ url: ogImageUrl({ title: 'Les événements', kicker: 'Overbound', photo: 'crowd' }), width: 1200, height: 630, alt: 'Overbound Race' }],
    locale: 'fr_FR',
    type: 'website',
  },
}

export const revalidate = 60

/**
 * Events hub. While an edition is open or announced, it sends visitors to it;
 * otherwise it thanks the last edition's participants and collects the
 * waiting list for the next one.
 */
export default async function EventsPage() {
  const featured = await loadFeaturedEvent().catch(() => null)
  if (featured?.event?.slug) redirect(`/events/${featured.event.slug}`)

  const lastEvent = await loadLastEvent().catch(() => null)
  return <NextEditionTeaser lastEvent={lastEvent} />
}
