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
        // Account, auth, billing, preferences and unsubscribe pages stay
        // crawlable: they set noindex, which Google can only read if it
        // is allowed to fetch them.
        disallow: ['/api/', '/dashboard/', '/studio/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
