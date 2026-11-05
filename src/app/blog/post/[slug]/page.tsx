import { loadAllPosts, loadPostBySlug, listRelatedPosts } from '@/lib/blog/loadPosts'
import { getCategoryBySlug } from '@/lib/blog/categories'
import { extractHeadings, renderBlogMarkdown } from '@/lib/blog/renderMarkdown'
import { SITE_SETTINGS } from '@/constants/siteSettings'
import { safeJsonStringify } from '@/lib/safeJson'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { containerClass, DISPLAY_TITLE, Pill } from '@/components/ds'
import { cn } from '@/lib/utils'
import BlogArticleItem from '@/components/blog/BlogArticleItem'
import { ArticleTocAside, ArticleTocMobile } from '@/components/blog/ArticleToc'

// Articles are MDX files compiled at build time: static pages, no revalidation window.

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
})

export async function generateStaticParams() {
  return loadAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params
  const post = loadPostBySlug(slug)

  if (!post) {
    return { title: 'Article introuvable' }
  }

  const title = `${post.title} | ${SITE_SETTINGS.siteTitle}`
  const description = post.excerpt || SITE_SETTINGS.description
  const generatedOg = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'}/api/og/post/${post.slug}`
  const ogImageUrl = post.ogImage || generatedOg
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
  const canonical = `${siteUrl}/blog/post/${post.slug}`

  return {
    // The root template appends the brand.
    title: post.title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Overbound Race',
      locale: 'fr_FR',
      type: 'article',
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  }
}

export default async function BlogPostPage(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params
  const post = loadPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const category = getCategoryBySlug(post.category)
  const related = listRelatedPosts(post.slug, post.category)
  const toc = extractHeadings(post.content)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
  const canonical = `${siteUrl}/blog/post/${post.slug}`
  const publishedLabel = dateFormatter.format(new Date(post.publishedAt))

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Reading progress, CSS-only (globals.css) */}
      <div aria-hidden className="reading-progress" />

      {/* JSON-LD Article structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonStringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt || post.publishedAt,
            author: { '@type': 'Person', name: post.author.name },
            publisher: {
              '@type': 'Organization',
              name: 'Overbound Race',
              logo: { '@type': 'ImageObject', url: `${siteUrl}/images/brand/LOGO_FULL.png` },
            },
            image: `${siteUrl}${post.mainImage}`,
            mainEntityOfPage: canonical,
          }),
        }}
      />
      {/* JSON-LD Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonStringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { name: 'Accueil', item: `${siteUrl}/` },
              { name: 'Blog', item: `${siteUrl}/blog` },
              category
                ? { name: category.title, item: `${siteUrl}/blog/categorie/${category.slug}` }
                : null,
              { name: post.title, item: canonical },
            ]
              .filter((crumb): crumb is { name: string; item: string } => crumb !== null)
              // Positions must follow each other, even without a category.
              .map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, ...crumb })),
          }),
        }}
      />

      {/* Header: everything centred on the reading column */}
      <div className={cn(containerClass(), 'pt-10 sm:pt-16')}>
        <header className="mx-auto max-w-article text-center">
          <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Accueil</Link>
            <span aria-hidden>/</span>
            <Link href="/blog" className="hover:text-foreground">Blog</Link>
            {category ? (
              <>
                <span aria-hidden>/</span>
                <Link href={`/blog/categorie/${category.slug}`} className="hover:text-foreground">
                  {category.title}
                </Link>
              </>
            ) : null}
          </nav>

          {category ? (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link href={`/blog/categorie/${category.slug}`} className="rounded-full">
                <Pill variant="tag">{category.title}</Pill>
              </Link>
            </div>
          ) : null}

          <h1 className={cn(DISPLAY_TITLE, 'mt-6 text-display-lg')}>{post.title}</h1>

          {post.excerpt ? (
            <p className="mx-auto mt-6 text-lead text-muted-foreground">{post.excerpt}</p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <time dateTime={post.publishedAt}>{publishedLabel}</time>
            <span aria-hidden>•</span>
            <span>par {post.author.name}</span>
            <span aria-hidden>•</span>
            <span>{post.readingTime} min de lecture</span>
          </div>

          <span aria-hidden className="mx-auto mt-10 block h-0.5 w-12 rounded-full bg-primary" />
        </header>
      </div>

      {/* Cover, wider than the reading column */}
      <div className={cn(containerClass(), 'mt-12 sm:mt-16')}>
        <div className="relative aspect-16/10 overflow-hidden rounded-2xl bg-muted sm:aspect-21/9">
          <Image
            src={post.mainImage}
            alt={post.mainImageAlt}
            fill
            sizes="(min-width: 1280px) 1216px, 100vw"
            priority
            className="object-cover"
          />
        </div>
      </div>

      {/* Body: centred column, sommaire on the right edge from xl (the empty left cell keeps the column centred) */}
      <div
        className={cn(
          containerClass(),
          'mt-12 pb-20 sm:mt-16 xl:grid xl:grid-cols-[1fr_minmax(0,var(--container-article))_1fr] xl:gap-x-12',
        )}
      >
        <div aria-hidden className="hidden xl:block" />

        <article className="mx-auto w-full min-w-0 max-w-article">
          <ArticleTocMobile items={toc} />
          <div className="prose-overbound">{renderBlogMarkdown(post.content)}</div>
        </article>

        <ArticleTocAside items={toc} />
      </div>

      {/* Related posts (same category) */}
      {related.length > 0 ? (
        <section className={cn(containerClass(), 'border-t border-border pt-12 pb-16 md:pt-16')}>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
            <div>
              <h2 className={cn(DISPLAY_TITLE, 'text-display-md')}>Articles associés</h2>
              <p className="mt-2 text-sm text-muted-foreground">Poursuis ta lecture sur des thèmes proches.</p>
            </div>
            <Link href="/blog" className="text-sm font-medium text-primary hover:underline">
              Retour au blog
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {related.map((r) => (
              <BlogArticleItem key={r.slug} post={r} showExcerpt={false} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
