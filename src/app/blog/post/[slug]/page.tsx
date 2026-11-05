import { loadAllPosts, loadPostBySlug, listRelatedPosts } from '@/lib/blog/loadPosts'
import { getCategoryBySlug } from '@/lib/blog/categories'
import { renderBlogMarkdown, extractHeadings } from '@/lib/blog/renderMarkdown'
import { SITE_SETTINGS } from '@/constants/siteSettings'
import { safeJsonStringify } from '@/lib/safeJson'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Container, Section, Pill } from '@/components/ds'
import BlogArticleItem from '@/components/blog/BlogArticleItem'
import ArticleToc from '@/components/blog/ArticleToc'

// Posts are filesystem content (MDX), compiled at build time: no
// revalidation window needed, unlike the old Sanity-backed revalidate = 60.

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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
  const canonical = `${siteUrl}/blog/post/${post.slug}`
  const body = renderBlogMarkdown(post.content)
  const headings = extractHeadings(post.content)

  return (
    <main className="bg-background">
      <article>
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
              image: post.mainImage ? `${siteUrl}${post.mainImage}` : undefined,
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

        {/* Hero */}
        <Section spacing="compact">
          <Container size="prose">
            <nav className="mb-4 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Accueil</Link>
              <span className="mx-1.5">/</span>
              <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              {category ? (
                <>
                  <span className="mx-1.5">/</span>
                  <Link
                    href={`/blog/categorie/${category.slug}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {category.title}
                  </Link>
                </>
              ) : null}
            </nav>

            {category ? (
              <div className="mb-4">
                <Link href={`/blog/categorie/${category.slug}`}>
                  <Pill variant="tag">{category.title}</Pill>
                </Link>
              </div>
            ) : null}

            <h1 className="text-display-md font-display font-bold uppercase leading-tight text-balance">
              {post.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {post.publishedAt && (
                <span>{new Date(post.publishedAt).toLocaleDateString('fr-FR')}</span>
              )}
              <span>·</span>
              <span>par {post.author.name}</span>
              {post.readingTime ? (
                <>
                  <span>·</span>
                  <span>{post.readingTime} min de lecture</span>
                </>
              ) : null}
            </div>

            {post.mainImage && (
              <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
                <Image
                  src={post.mainImage}
                  alt={post.mainImageAlt}
                  fill
                  sizes="(min-width: 1024px) 768px, 100vw"
                  priority
                  className="object-cover"
                />
              </div>
            )}
          </Container>
        </Section>

        {/* Article body */}
        <Section spacing="none" className="pb-8 md:pb-10">
          <Container size="page">
            <div className="mx-auto grid max-w-[64rem] grid-cols-1 gap-12 lg:grid-cols-[1fr_16rem]">
              <div className="mx-auto w-full max-w-3xl lg:mx-0 lg:max-w-none">
                {post.excerpt && (
                  <p className="text-lead text-muted-foreground">
                    {post.excerpt}
                  </p>
                )}

                <div className="prose-overbound mt-6">
                  {body}
                </div>
              </div>

              <ArticleToc headings={headings} />
            </div>
          </Container>
        </Section>

        {/* Related posts (same category, when there are other articles there) */}
        {related.length > 0 ? (
          <Section tone="light" spacing="compact">
            <Container size="prose">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-title font-display font-bold uppercase">Articles associés</h2>
                  <p className="text-sm text-muted-foreground">
                    Poursuis ta lecture sur {category?.title.toLowerCase() ?? 'le même thème'}.
                  </p>
                </div>
                <Link href="/blog" className="text-sm font-medium text-primary hover:underline">
                  Retour au blog
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                {related.map((r) => (
                  <BlogArticleItem key={r.slug} post={r} showExcerpt={false} />
                ))}
              </div>
            </Container>
          </Section>
        ) : null}
      </article>
    </main>
  )
}
