import { fetchSinglePost } from '@/app/api/blog/blogQueries'
import RichText from '@/components/RichText'
import { markdownToHtml } from '@/lib/markdown'
import { safeJsonStringify } from '@/lib/safeJson'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { relatedPostsQuery, settingsQuery, sitemapPostsQuery } from '@/sanity/lib/queries'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { estimateReadingTime } from '@/lib/readingTime'
import { buildArticleToc } from '@/lib/blog/articleToc'
import Image from 'next/image'
import { containerClass, DISPLAY_TITLE, Pill } from '@/components/ds'
import { cn } from '@/lib/utils'
import BlogArticleItem from '@/components/blog/BlogArticleItem'
import { ArticleSections } from '@/components/blog/ArticleSections'
import { ArticleTocAside, ArticleTocMobile } from '@/components/blog/ArticleToc'

// Articles are pre-rendered at build time and regenerated at most every minute.
export const revalidate = 60

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
})

export async function generateStaticParams() {
  try {
    const posts = await client.fetch<Array<{ slug: string }>>(sitemapPostsQuery)
    return posts.filter((post) => post.slug).map((post) => ({ slug: post.slug }))
  } catch {
    // Sanity unreachable at build time: articles render on first visit instead.
    return []
  }
}

async function loadPost(slug: string) {
  try {
    return await fetchSinglePost(slug)
  } catch {
    return null
  }
}

async function loadSettings() {
  try {
    return await client.fetch(settingsQuery)
  } catch {
    return null
  }
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params
  const [post, settings] = await Promise.all([loadPost(slug), loadSettings()])

  if (!post) {
    return { title: 'Article introuvable' }
  }

  const siteTitle = settings?.siteTitle || 'OverBound'
  const title = `${post.title} — ${siteTitle}`
  const description = post.excerpt || settings?.description
  const ogImage = post.ogImage || settings?.ogImage
  const generatedOg = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'}/api/og/post/${post.slug}`
  const ogImageUrl = ogImage ? urlFor(ogImage).width(1200).height(630).url() : generatedOg
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
  const post = await loadPost(slug)

  if (!post) {
    notFound()
  }
  const categorySlugs = (post.categories || []).map((c: any) => (typeof c.slug === 'string' ? c.slug : c.slug?.current)).filter(Boolean)
  const related = await client.fetch(relatedPostsQuery, { slug: post.slug, categorySlugs })
  const bodyText = Array.isArray(post.body)
    ? post.body.map((b: any) => (b.children ? b.children.map((c: any) => c.text).join('\n') : '')).join('\n')
    : ''
  const sectionsText = Array.isArray(post.sections)
    ? post.sections
        .map((s: any) =>
          Array.isArray(s.body)
            ? s.body.map((b: any) => (b.children ? b.children.map((c: any) => c.text).join('\n') : '')).join('\n')
            : ''
        )
        .join('\n')
    : ''
  const normalizedBody = bodyText.replace(/\\n/g, '\n')
  const readingSource = [bodyText, sectionsText].filter(Boolean).join('\n') || bodyText
  const rt = estimateReadingTime(readingSource)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
  const canonical = `${siteUrl}/blog/post/${post.slug}`

  const hasSections = Array.isArray(post.sections) && post.sections.length > 0
  // Legacy bodies stored as markdown text: rendered as HTML, which carries no heading anchors, so no sommaire.
  const usesMarkdown = !hasSections && /(^|\n)#{1,3}\s|\n\n|\[(.*?)\]\((.*?)\)/.test(normalizedBody)
  const toc = buildArticleToc({ sections: post.sections, body: usesMarkdown ? null : post.body })
  const authorSlug = typeof post.author?.slug === 'string' ? post.author.slug : post.author?.slug?.current
  const publishedLabel = post.publishedAt ? dateFormatter.format(new Date(post.publishedAt)) : null

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
            datePublished: post.publishedAt || undefined,
            dateModified: post._updatedAt || post.publishedAt || undefined,
            author: post.author?.name ? { '@type': 'Person', name: post.author.name } : undefined,
            publisher: {
              '@type': 'Organization',
              name: 'Overbound Race',
              logo: { '@type': 'ImageObject', url: `${siteUrl}/images/brand/LOGO_FULL.png` },
            },
            image: post.mainImage ? urlFor(post.mainImage).width(1200).height(630).url() : undefined,
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
              post.categories?.[0]?.title
                ? { name: post.categories[0].title, item: `${siteUrl}/blog/categorie/${post.categories[0].slug}` }
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
            {post.categories?.[0]?.slug ? (
              <>
                <span aria-hidden>/</span>
                <Link
                  href={`/blog/categorie/${typeof post.categories[0].slug === 'string' ? post.categories[0].slug : post.categories[0].slug?.current}`}
                  className="hover:text-foreground"
                >
                  {post.categories[0].title}
                </Link>
              </>
            ) : null}
          </nav>

          {post.categories?.length ? (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {post.categories.map((c: any) => {
                const slug = typeof c.slug === 'string' ? c.slug : c.slug?.current
                if (!slug) return null
                return (
                  <Link key={slug} href={`/blog/categorie/${slug}`} className="rounded-full">
                    <Pill variant="tag">{c.title}</Pill>
                  </Link>
                )
              })}
            </div>
          ) : null}

          <h1 className={cn(DISPLAY_TITLE, 'mt-6 text-display-lg')}>{post.title}</h1>

          {post.excerpt ? (
            <p className="mx-auto mt-6 text-lead text-muted-foreground">{post.excerpt}</p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            {publishedLabel ? <time dateTime={post.publishedAt}>{publishedLabel}</time> : null}
            {post.author?.name ? (
              <>
                {publishedLabel ? <span aria-hidden>•</span> : null}
                <span>
                  par{' '}
                  <Link href={`/blog/auteur/${authorSlug}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                    {post.author.name}
                  </Link>
                </span>
              </>
            ) : null}
            {rt.minutes ? (
              <>
                <span aria-hidden>•</span>
                <span>{rt.minutes} min de lecture</span>
              </>
            ) : null}
          </div>

          <span aria-hidden className="mx-auto mt-10 block h-0.5 w-12 rounded-full bg-primary" />
        </header>
      </div>

      {/* Cover, wider than the reading column */}
      {post.mainImage ? (
        <div className={cn(containerClass(), 'mt-12 sm:mt-16')}>
          <div className="relative aspect-16/10 overflow-hidden rounded-2xl bg-muted sm:aspect-21/9">
            <Image
              src={urlFor(post.mainImage).width(1600).height(900).url()}
              alt={post.mainImage.alt || ''}
              fill
              sizes="(min-width: 1280px) 1216px, 100vw"
              priority
              className="object-cover"
            />
          </div>
        </div>
      ) : null}

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

          {hasSections ? (
            <ArticleSections sections={post.sections} />
          ) : usesMarkdown ? (
            <div className="prose-overbound">
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(normalizedBody) }} />
            </div>
          ) : (
            <div className="prose-overbound">
              <RichText value={post.body} variant="article" />
            </div>
          )}
        </article>

        <ArticleTocAside items={toc} />
      </div>

      {/* Related posts */}
      {related?.length ? (
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
            {related.map((r: any) => (
              <BlogArticleItem key={r._id} post={r} showExcerpt={false} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
