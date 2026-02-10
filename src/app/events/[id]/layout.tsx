import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/server'
import { EventStructuredDataServer } from '@/components/seo/EventStructuredDataServer'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
const fallbackImage = `${siteUrl}/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.avif`

type EventMeta = Record<string, any> & {
  title: string
  date: string
  location: string
  status: string
  slug: string | null
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
  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('events')
    .select(
      `
        *,
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
    if (error) console.error('[event meta]', id, error.message)
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
    normalizeText(event.subtitle) ||
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
