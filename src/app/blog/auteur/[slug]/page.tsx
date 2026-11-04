import { COVER } from '@/constants/coverImages'
import { ogImageUrl } from '@/lib/seo/ogImage'
import { client } from '@/sanity/lib/client'
import { postsByAuthorSlugQuery } from '@/sanity/lib/queries'
import Link from 'next/link'
import Image from 'next/image'
import BlogArticleItem from '@/components/blog/BlogArticleItem'
import BlogPagination from '@/components/blog/BlogPagination'
import { urlFor } from '@/sanity/lib/image'
import type { Metadata } from 'next'
import { containerClass, DISPLAY_TITLE } from '@/components/ds'
import { PageHero } from '@/components/hero/PageHero'
import { cn } from '@/lib/utils'

export const revalidate = 60

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
const heroImage = `${siteUrl}${ogImageUrl({ title: 'Blog Overbound', kicker: 'Auteur', photo: 'group' })}`

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

  const { author } = await client.fetch(postsByAuthorSlugQuery, { slug, offset: 0, end: 1 })

  if (!author) {
    return {
      title: { absolute: 'Auteur introuvable | Overbound Race' },
      robots: { index: false, follow: false },
    }
  }

  const title = `Articles de ${author.name} | Blog OCR - Overbound Race`
  const description = `Découvre les articles OCR de ${author.name} : préparation, conseils et course à obstacles Paris 2026 avec Overbound Race.`
  const canonical = `${siteUrl}/blog/auteur/${slug}`

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
      type: 'profile',
      images: [
        {
          url: heroImage,
          width: 1200,
          height: 630,
          alt: `Auteur ${author.name} - Overbound Race`,
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

export default async function BlogAuthorPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ page?: string }> }) {
  const { slug } = await params
  const page = (await searchParams)?.page
  const pageSize = 12
  const current = Math.max(1, parseInt(page || '1', 10) || 1)
  const offset = (current - 1) * pageSize
  const end = offset + pageSize

  const { author, items, total } = await client.fetch(postsByAuthorSlugQuery, { slug, offset, end })
  const pageCount = Math.max(1, Math.ceil((total || 0) / pageSize))

  if (!author) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className={cn(containerClass(), 'py-24 text-center')}>
          <p className={cn(DISPLAY_TITLE, 'text-display-md')}>Auteur introuvable</p>
          <Link href="/blog/auteurs" className="mt-4 inline-block text-sm text-primary hover:underline">
            Voir tous les auteurs
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PageHero
        image={{ src: COVER.pages.blog, alt: 'Auteur OverBound', position: '50% 30%' }}
        title={author.name}
        aside={
          author.avatar ? (
            <div className="relative mx-auto aspect-square w-32 overflow-hidden rounded-full border border-border lg:mx-0">
              <Image
                src={urlFor(author.avatar).width(240).height(240).url()}
                alt=""
                fill
                sizes="128px"
                className="object-cover"
              />
            </div>
          ) : undefined
        }
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
        hrefFor={(page) => `/blog/auteur/${slug}?page=${page}`}
      />
      </div>
    </main>
  )
}
