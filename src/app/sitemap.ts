import { MetadataRoute } from 'next'
import { loadPostSummaries } from '@/lib/blog/loadPosts'
import { BLOG_CATEGORIES } from '@/lib/blog/categories'
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
    '/about/our-story',
    // '/about/team',
    '/about/faq',
    '/about/partners',
    '/about/credits',
    '/bootcamps',
    '/events/formats',
    '/course-a-obstacles-paris',
    '/course-a-obstacles-en-boucles',
    '/overbound-en-bref',
    '/obstacles',
    '/blog',
    '/blog/categories',
    '/volunteers',
    '/entreprises',
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
    changeFrequency: page === '' ? 'daily' : 'weekly',
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

  // Articles de blog (MDX, filesystem)
  const blogEntries: MetadataRoute.Sitemap = loadPostSummaries().map((post) => ({
    url: `${siteUrl}/blog/post/${post.slug}`,
    lastModified: new Date(post.updatedAt || post.publishedAt || buildDate),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Catégories du blog
  const blogTaxonomyEntries: MetadataRoute.Sitemap = BLOG_CATEGORIES.map((category) => ({
    url: `${siteUrl}/blog/categorie/${category.slug}`,
    lastModified: buildDate,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  return [...staticEntries, ...eventEntries, ...blogEntries, ...blogTaxonomyEntries]
}
