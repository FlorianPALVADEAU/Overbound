import { safeJsonStringify } from '@/lib/safeJson'

export function OrganizationStructuredDataServer() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: 'Overbound Race',
    alternateName: ['Overbound', 'Overbound OCR', 'Backyard à Obstacles'],
    url: siteUrl,
    logo: `${siteUrl}/images/LOGO_FULL.webp`,
    description:
      'Overbound Race : première course à obstacles format backyard en France. Course obstacles Paris 2026, OCR personnalisable. Choisis ta distance et ta difficulté.',
    email: 'contact@overbound-race.com',
    areaServed: {
      '@type': 'Place',
      name: 'Paris et Île-de-France',
    },
    sameAs: ['https://www.facebook.com/overbound.race/', 'https://www.instagram.com/overbound.race/'],
    sport: 'Obstacle Course Racing',
    keywords: 'course à obstacles paris, backyard à obstacles, OCR france 2026, overbound race',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonStringify(structuredData) }}
    />
  )
}
