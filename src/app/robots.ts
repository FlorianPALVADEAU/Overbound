import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'

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
