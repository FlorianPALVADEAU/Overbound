import { client } from '@/sanity/lib/client'
import { postsQuery } from '@/sanity/lib/queries'

export const revalidate = 300

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
  const posts = await client.fetch(postsQuery)

  const items = posts
    .map((p: any) => {
      const link = `${siteUrl}/blog/post/${p.slug}`
      const pubDate = p.publishedAt ? new Date(p.publishedAt).toUTCString() : new Date().toUTCString()
      return `
      <item>
        <title><![CDATA[${p.title}]]></title>
        <link>${link}</link>
        <guid>${link}</guid>
        <pubDate>${pubDate}</pubDate>
        ${p.excerpt ? `<description><![CDATA[${p.excerpt}]]></description>` : ''}
      </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
    <channel>
      <title>OverBound — Blog</title>
      <link>${siteUrl}/blog</link>
      <description>Articles OverBound</description>
      ${items}
    </channel>
  </rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}

