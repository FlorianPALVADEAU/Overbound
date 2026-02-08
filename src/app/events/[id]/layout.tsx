import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase/server'
import { EventStructuredDataServer } from '@/components/seo/EventStructuredDataServer'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
const fallbackImage = `${siteUrl}/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.avif`

type EventMeta = {
  title: string
  description: string | null
  image_url: string | null
  date: string
  location: string
  status: string
  slug: string | null
  updated_at: string | null
  tickets?: Array<{
    name: string | null
    final_price_cents: number | null
    currency: string | null
  }> | null
}

const isUUID = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

const normalizeText = (value?: string | null) =>
  value ? value.replace(/\s+/g, ' ').trim() : ''

const truncate = (value: string, max = 160) =>
  value.length > max ? `${value.slice(0, max - 1).trim()}…` : value

const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return fallbackImage
  if (value.startsWith('http')) return value
  return `${siteUrl}${value}`
}

const fetchEventMeta = async (id: string): Promise<EventMeta | null> => {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('events')
    .select(
      `
        title,
        description,
        image_url,
        date,
        location,
        status,
        slug,
        updated_at,
        tickets (
          name,
          final_price_cents,
          currency
        )
      `
    )
    .eq(isUUID(id) ? 'id' : 'slug', id)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as EventMeta
}

export async function generateMetadata(
  props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await props.params
  const event = await fetchEventMeta(id)

  if (!event) {
    return {
      title: 'Événement introuvable | Overbound Race',
      robots: { index: false, follow: false },
    }
  }

  const canonical = `${siteUrl}/events/${event.slug || id}`
  const title = `${event.title} | Course à Obstacles Paris 2026 - Overbound Race`
  const description = truncate(
    normalizeText(event.description) ||
      'Overbound Race : course à obstacles Paris 2026, backyard à obstacles et formats personnalisables. Choisis ta distance et ta difficulté.'
  )
  const imageUrl = toAbsoluteUrl(event.image_url)
  const shouldIndex = !['draft', 'cancelled'].includes(event.status)

  return {
    title,
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
      {event ? <EventStructuredDataServer event={event} /> : null}
      {children}
    </>
  )
}
