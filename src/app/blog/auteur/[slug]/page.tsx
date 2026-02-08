import { client } from '@/sanity/lib/client'
import { postsByAuthorSlugQuery } from '@/sanity/lib/queries'
import Link from 'next/link'
import Image from 'next/image'
import BlogArticleItem from '@/components/blog/BlogArticleItem'
import { urlFor } from '@/sanity/lib/image'
import type { Metadata } from 'next'

export const revalidate = 60

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
const heroImage = `${siteUrl}/images/hero_header_poster.jpg`

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
      title: 'Auteur introuvable | Overbound Race',
      robots: { index: false, follow: false },
    }
  }

  const title = `Articles de ${author.name} | Blog OCR - Overbound Race`
  const description = `Découvre les articles OCR de ${author.name} : préparation, conseils et course à obstacles Paris 2026 avec Overbound Race.`
  const canonical = `${siteUrl}/blog/auteur/${slug}`

  return {
    title,
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
    return <div className="max-w-5xl mx-auto p-6">Auteur introuvable.</div>
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      <section className="relative isolate overflow-hidden py-14">
        <div className="absolute inset-0">
          <Image src="/images/hero_header_poster.jpg" alt="Auteur OverBound" fill sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-background/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/70 to-background" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
          <h1 className="text-3xl font-bold mb-2">Auteur: {author.name}</h1>
          {author.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urlFor(author.avatar).width(120).height(120).url()} alt="" className="rounded-full w-24 h-24 mt-2" />
          ) : null}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6">

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items?.map((p: any) => (
          <BlogArticleItem key={p._id} post={p} />
        ))}
      </div>

      {pageCount > 1 && (
        <nav className="flex items-center justify-center gap-3 mt-8">
          {current > 1 && (
            <Link href={`/blog/auteur/${slug}?page=${current - 1}`} className="px-3 py-1 border rounded-full">Précédent</Link>
          )}
          <span className="text-sm opacity-70">Page {current} / {pageCount}</span>
          {current < pageCount && (
            <Link href={`/blog/auteur/${slug}?page=${current + 1}`} className="px-3 py-1 border rounded-full">Suivant</Link>
          )}
        </nav>
      )}
      </div>
    </main>
  )}
