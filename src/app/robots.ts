import { MetadataRoute } from 'next'

// Crawlers that fetch pages to answer a user's question or run a search.
const ANSWER_BOTS = ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'Claude-SearchBot', 'Claude-User']

// Crawlers that collect pages to train models.
const TRAINING_BOTS = ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended', 'Applebot-Extended', 'Bytespider']

const PRIVATE_PATHS = ['/api/', '/dashboard/', '/studio/']

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
        disallow: PRIVATE_PATHS,
      },
      { userAgent: ANSWER_BOTS, allow: '/', disallow: PRIVATE_PATHS },
      { userAgent: TRAINING_BOTS, disallow: '/' },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
