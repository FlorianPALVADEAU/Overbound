import { client } from '@/sanity/lib/client'
import { postsQuery } from '@/sanity/lib/queries'

export default async function sitemap() {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
  const siteUrl = rawSiteUrl.replace(/\/$/, '')
  const posts = await client.fetch(postsQuery)
  const items = posts.map((p: any) => ({
    url: `${siteUrl}/blog/post/${p.slug}`,
    lastModified: p.publishedAt ? new Date(p.publishedAt) : new Date(),
  }))
  return [
    { url: `${siteUrl}/blog`, lastModified: new Date() },
    ...items,
  ]
}

