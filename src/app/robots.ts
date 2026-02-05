import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Normaliser l'URL en enlevant le trailing slash
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
  const siteUrl = rawSiteUrl.replace(/\/$/, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/account/',
          '/auth/',
          '/studio/',
          '/preferences/',
          '/billing/',
          '/unsubscribe/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
