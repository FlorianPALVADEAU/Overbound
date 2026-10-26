import { DEFAULT_OG_IMAGE_URL } from './ogImage'
import { calculateCurrentPrice, getCurrentPriceTier, type EventPriceTier } from '@/types/EventPriceTier'
import { COMPANY_INFO } from '@/constants/companyInfo'
import { BRAND, EDITION_2026_LISTINGS, FORMAT_FACTS, NEXT_EDITION, PREVIOUS_EDITION, SITE_URL, TEASER_VIDEO } from './siteFacts'

export const LOGO_URL = `${SITE_URL}/images/brand/LOGO_FULL.png`
const FALLBACK_IMAGE = `${SITE_URL}${DEFAULT_OG_IMAGE_URL}`

export const SOCIAL_PROFILES = [
  'https://www.facebook.com/overbound.race/',
  'https://www.instagram.com/overbound.race/',
  'https://www.tiktok.com/@overbound.race',
]

export const buildOrganizationJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'SportsOrganization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Overbound Race',
  legalName: COMPANY_INFO.legalName,
  alternateName: ['Overbound'],
  url: SITE_URL,
  logo: LOGO_URL,
  description: `Overbound organise une course à obstacles en boucles de ${FORMAT_FACTS.loopKm} km en Île-de-France, avec deux formats : OPEN et RANKED. Prochaine édition ${NEXT_EDITION.window}.`,
  email: 'contact@overbound-race.com',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'contact@overbound-race.com',
    availableLanguage: 'fr',
  },
  founder: { '@type': 'Person', name: COMPANY_INFO.director.name, jobTitle: COMPANY_INFO.director.title },
  address: {
    '@type': 'PostalAddress',
    streetAddress: COMPANY_INFO.address.street,
    postalCode: COMPANY_INFO.address.zipCode,
    addressLocality: COMPANY_INFO.address.city,
    addressCountry: 'FR',
  },
  areaServed: { '@type': 'Place', name: 'Paris et Île-de-France' },
  sameAs: SOCIAL_PROFILES,
  sport: 'Obstacle Course Racing',
})

export const buildWebSiteJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'Overbound Race',
  alternateName: BRAND.name,
  url: SITE_URL,
  inLanguage: 'fr-FR',
  publisher: { '@id': `${SITE_URL}/#organization` },
})

export interface BreadcrumbItem {
  name: string
  path: string
}

export const buildBreadcrumbJsonLd = (items: BreadcrumbItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: 'Accueil', path: '' }, ...items].map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${SITE_URL}${item.path}`,
  })),
})

type TicketOffer = {
  name?: string | null
  final_price_cents?: number | null
  currency?: string | null
}

export type SportsEventInput = {
  title: string
  description?: string | null
  date: string
  end_date?: string | null
  location: string
  status?: string | null
  slug?: string | null
  image_url?: string | null
  sales_start?: string | null
  latitude?: number | null
  longitude?: number | null
  tickets?: TicketOffer[] | null
  price_tiers?: EventPriceTier[] | null
}

const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return FALLBACK_IMAGE
  return value.startsWith('http') ? value : `${SITE_URL}${value}`
}

const toAvailability = (status?: string | null) => {
  switch (status) {
    case 'sold_out':
      return 'https://schema.org/SoldOut'
    case 'announced':
      return 'https://schema.org/PreOrder'
    case 'closed':
    case 'completed':
      return 'https://schema.org/OutOfStock'
    case 'cancelled':
      return 'https://schema.org/Discontinued'
    default:
      return 'https://schema.org/InStock'
  }
}

// schema.org has no "completed" state: a finished edition stays EventScheduled.
const toEventStatus = (status?: string | null) =>
  status === 'cancelled' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled'

const hasCoordinates = (event: SportsEventInput) =>
  typeof event.latitude === 'number' && typeof event.longitude === 'number'

export const buildSportsEventJsonLd = (event: SportsEventInput) => {
  const canonical = `${SITE_URL}/events/${event.slug ?? ''}`.replace(/\/$/, '')
  const availability = toAvailability(event.status)
  const activeTier = getCurrentPriceTier(event.price_tiers ?? [])

  const offers = (event.tickets ?? [])
    .filter((ticket) => typeof ticket.final_price_cents === 'number')
    .map((ticket) => ({
      '@type': 'Offer',
      name: ticket.name || event.title,
      price: Math.max(calculateCurrentPrice(ticket.final_price_cents as number, activeTier), 0) / 100,
      priceCurrency: (ticket.currency || 'EUR').toUpperCase(),
      availability,
      validFrom: event.sales_start || undefined,
      url: canonical,
    }))

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: event.title,
    description: event.description || undefined,
    sport: 'Obstacle Course Racing',
    startDate: event.date,
    endDate: event.end_date || undefined,
    eventStatus: toEventStatus(event.status),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: [toAbsoluteUrl(event.image_url)],
    location: {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.location,
        addressRegion: 'Île-de-France',
        addressCountry: 'FR',
      },
      geo: hasCoordinates(event)
        ? { '@type': 'GeoCoordinates', latitude: event.latitude, longitude: event.longitude }
        : undefined,
    },
    organizer: { '@id': `${SITE_URL}/#organization` },
    offers: offers.length > 0 ? offers : undefined,
    url: canonical,
    sameAs: event.slug === PREVIOUS_EDITION.slug ? [...EDITION_2026_LISTINGS] : undefined,
  }
}

export const buildTeaserVideoJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: TEASER_VIDEO.name,
  description: TEASER_VIDEO.description,
  thumbnailUrl: [`${SITE_URL}${TEASER_VIDEO.posterPath}`],
  uploadDate: TEASER_VIDEO.uploadDate,
  duration: TEASER_VIDEO.duration,
  contentUrl: `${SITE_URL}${TEASER_VIDEO.contentPath}`,
  inLanguage: 'fr-FR',
  publisher: { '@id': `${SITE_URL}/#organization` },
})
