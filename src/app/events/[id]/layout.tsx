import type { Metadata } from 'next'
import { ogImageUrl } from '@/lib/seo/ogImage'
import { fetchEventMeta } from '@/lib/events/eventMeta'
import { getEffectiveEventStatus } from '@/lib/events/registrationStatus'
import { EventStructuredDataServer } from '@/components/seo/EventStructuredDataServer'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
const fallbackImage = `${siteUrl}${ogImageUrl({ title: 'Événement Overbound', kicker: 'Course à obstacles en boucles', photo: 'crowd' })}`

const normalizeText = (value?: string | null) =>
  value ? value.replace(/\s+/g, ' ').trim() : ''

const truncate = (value: string, max = 160) =>
  value.length > max ? `${value.slice(0, max - 1).trim()}…` : value

const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return fallbackImage
  if (value.startsWith('http')) return value
  return `${siteUrl}${value}`
}

export async function generateMetadata(
  props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await props.params
  const event = await fetchEventMeta(id)

  if (!event) {
    return {
      title: { absolute: 'Événement introuvable | Overbound Race' },
      robots: { index: false, follow: false },
    }
  }

  const canonical = `${siteUrl}/events/${event.slug || id}`
  const title = `${event.title} | Course à obstacles en boucles - Overbound Race`
  const description = truncate(
    normalizeText(event.subtitle) ||
      'Overbound Race : course à obstacles en boucles de 2 km, deux formats (RANKED et OPEN) pour tous les niveaux.'
  )
  const imageUrl = toAbsoluteUrl(event.image_url)
  const shouldIndex = !['draft', 'cancelled'].includes(event.status)

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Overbound Race',
      locale: 'fr_FR',
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
    },
  }
}

export default async function EventDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await fetchEventMeta(id)

  return (
    <>
      {event ? (
        <EventStructuredDataServer event={{ ...event, status: getEffectiveEventStatus(event) }} />
      ) : null}
      {children}
    </>
  )
}
