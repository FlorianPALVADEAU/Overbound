import { MetadataRoute } from 'next'
import { client } from '@/sanity/lib/client'
import { postsQuery } from '@/sanity/lib/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'

  // Pages statiques principales
  const staticPages = [
    '',
    '/about/concept',
    '/about/our-story',
    '/about/team',
    '/about/press',
    '/about/faq',
    '/events',
    '/events/formats',
    '/obstacles',
    '/blog',
    '/blog/categories',
    '/blog/auteurs',
    '/trainings',
    '/trainings/what-race-for-me',
    '/trainings/plans',
    '/trainings/fitness-test',
    '/volunteers',
    '/contact',
    '/cgv',
    '/cgu',
    '/mentions-legales',
    '/privacy-policies',
    '/cookies',
  ]

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${siteUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: page === '' || page === '/events' ? 'daily' : 'weekly',
    priority: page === '' ? 1 : page.startsWith('/events') ? 0.9 : 0.7,
  }))

  // Articles de blog dynamiques
  let blogEntries: MetadataRoute.Sitemap = []
  try {
    const posts = await client.fetch(postsQuery)
    blogEntries = posts.map((post: any) => ({
      url: `${siteUrl}/blog/post/${post.slug}`,
      lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error)
  }

  return [...staticEntries, ...blogEntries]
}
