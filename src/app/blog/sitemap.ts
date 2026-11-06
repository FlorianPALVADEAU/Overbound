import { loadPostSummaries } from '@/lib/blog/loadPosts'

export default async function sitemap() {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
  const siteUrl = rawSiteUrl.replace(/\/$/, '')
  const posts = loadPostSummaries()
  const items = posts.map((p) => ({
    url: `${siteUrl}/blog/post/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(p.publishedAt),
  }))
  return [
    { url: `${siteUrl}/blog`, lastModified: new Date() },
    ...items,
  ]
}

