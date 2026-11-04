import { COVER } from '@/constants/coverImages'
import { ogImageUrl } from '@/lib/seo/ogImage'
import { client } from '@/sanity/lib/client'
import { postsByCategorySlugQuery } from '@/sanity/lib/queries'
import Link from 'next/link'
import BlogArticleItem from '@/components/blog/BlogArticleItem'
import BlogPagination from '@/components/blog/BlogPagination'
import type { Metadata } from 'next'
import { containerClass, DISPLAY_TITLE } from '@/components/ds'
import { PageHero } from '@/components/hero/PageHero'
import { cn } from '@/lib/utils'

export const revalidate = 60

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
const heroImage = `${siteUrl}${ogImageUrl({ title: 'Blog Overbound', kicker: 'Catégorie', photo: 'group' })}`

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ page?: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = (await searchParams)?.page
  const current = Math.max(1, parseInt(page || '1', 10) || 1)
  const isPaged = current > 1

  const { category } = await client.fetch(postsByCategorySlugQuery, { slug, offset: 0, end: 1 })

  if (!category) {
    return {
      title: { absolute: 'Catégorie introuvable | Overbound Race' },
      robots: { index: false, follow: false },
    }
  }

  const title = `Catégorie ${category.title} | Blog OCR - Overbound Race`
  const description = `Articles et conseils OCR sur ${category.title}. Course à obstacles Paris 2026, backyard à obstacles et préparation Overbound Race.`
  const canonical = `${siteUrl}/blog/categorie/${slug}`

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Overbound Race',
      locale: 'fr_FR',
      type: 'website',
      images: [
        {
          url: heroImage,
          width: 1200,
          height: 630,
          alt: `Catégorie ${category.title} - Overbound Race`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [heroImage],
    },
    robots: isPaged ? { index: false, follow: true } : undefined,
  }
}

export default async function BlogCategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ page?: string }> }) {
  const { slug } = await params
  const page = (await searchParams)?.page
  const pageSize = 12
  const current = Math.max(1, parseInt(page || '1', 10) || 1)
  const offset = (current - 1) * pageSize
  const end = offset + pageSize

  const { category, items, total } = await client.fetch(postsByCategorySlugQuery, { slug, offset, end })
  const pageCount = Math.max(1, Math.ceil((total || 0) / pageSize))

  if (!category) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className={cn(containerClass(), 'py-24 text-center')}>
          <p className={cn(DISPLAY_TITLE, 'text-display-md')}>Catégorie introuvable</p>
          <Link href="/blog/categories" className="mt-4 inline-block text-sm text-primary hover:underline">
            Voir toutes les catégories
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PageHero
        image={{ src: COVER.pages.blog, alt: 'Catégorie OverBound', position: '50% 30%' }}
        title={<>Catégorie&nbsp;: {category.title}</>}
      />
      <div className={cn(containerClass(), 'py-16')}>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {items?.map((p: any) => (
          <BlogArticleItem key={p._id} post={p} />
        ))}
      </div>

      <BlogPagination
        current={current}
        pageCount={pageCount}
        hrefFor={(page) => `/blog/categorie/${slug}?page=${page}`}
      />
      </div>
    </main>
  )
}
