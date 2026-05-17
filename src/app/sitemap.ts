import { MetadataRoute } from 'next'
import { client } from '@/sanity/lib/client'
import { postsQuery, categoriesWithCountsQuery, authorsWithCountsQuery } from '@/sanity/lib/queries'
import { supabaseAdmin } from '@/lib/supabase/server'

const getBuildDate = () => {
  const raw =
    process.env.NEXT_PUBLIC_BUILD_TIME ||
    process.env.VERCEL_BUILD_TIME ||
    process.env.VERCEL_GIT_COMMIT_TIMESTAMP
  if (!raw) return new Date()
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Normaliser l'URL en enlevant le trailing slash pour éviter les doubles slashes
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
  const siteUrl = rawSiteUrl.replace(/\/$/, '')
  const buildDate = getBuildDate()

  // Pages statiques principales
  const staticPages = [
    '',
    '/about/concept',
    '/about/our-story',
    // '/about/team',
    '/about/press',
    '/about/faq',
    '/events',
    '/events/formats',
    // '/obstacles',
    '/blog',
    '/blog/categories',
    '/blog/auteurs',
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
    lastModified: buildDate,
    changeFrequency: page === '' || page === '/events' ? 'daily' : 'weekly',
    priority: page === '' ? 1 : page.startsWith('/events') ? 0.9 : 0.7,
  }))

  // Événements dynamiques
  let eventEntries: MetadataRoute.Sitemap = []
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      throw new Error('Missing Supabase env for sitemap events')
    }

    const supabase = supabaseAdmin()
    const { data: events, error } = await supabase
      .from('events')
      .select('slug, updated_at, date, status')
      .in('status', ['announced', 'on_sale', 'sold_out', 'closed', 'completed'])

    if (error) {
      throw error
    }

    eventEntries = (events || [])
      .filter((event) => event.slug)
      .map((event) => ({
        url: `${siteUrl}/events/${event.slug}`,
        lastModified: event.updated_at
          ? new Date(event.updated_at)
          : event.date
            ? new Date(event.date)
            : buildDate,
        changeFrequency: 'weekly',
        priority: 0.9,
      }))
  } catch (error) {
    console.error('Error fetching events for sitemap:', error)
  }

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

  // Catégories & auteurs du blog
  let blogTaxonomyEntries: MetadataRoute.Sitemap = []
  try {
    const [categories, authors] = await Promise.all([
      client.fetch(categoriesWithCountsQuery),
      client.fetch(authorsWithCountsQuery),
    ])

    const categoryEntries = (categories || [])
      .filter((category: any) => category.slug)
      .map((category: any) => ({
        url: `${siteUrl}/blog/categorie/${category.slug}`,
        lastModified: buildDate,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }))

    const authorEntries = (authors || [])
      .filter((author: any) => author.slug)
      .map((author: any) => ({
        url: `${siteUrl}/blog/auteur/${author.slug}`,
        lastModified: buildDate,
        changeFrequency: 'weekly' as const,
        priority: 0.4,
      }))

    blogTaxonomyEntries = [...categoryEntries, ...authorEntries]
  } catch (error) {
    console.error('Error fetching blog taxonomy for sitemap:', error)
  }

  return [...staticEntries, ...eventEntries, ...blogEntries, ...blogTaxonomyEntries]
}
