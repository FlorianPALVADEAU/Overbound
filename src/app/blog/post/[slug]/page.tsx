import { fetchSinglePost } from '@/app/api/blog/blogQueries'
import RichText from '@/components/RichText'
import { markdownToHtml } from '@/lib/markdown'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { relatedPostsQuery, settingsQuery } from '@/sanity/lib/queries'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { estimateReadingTime } from '@/lib/readingTime'
import Image from 'next/image'

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
    return { title: 'Article introuvable — OverBound' }
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
    title,
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <article className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* JSON-LD Article structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: post.title,
              datePublished: post.publishedAt || undefined,
              dateModified: post.publishedAt || undefined,
              author: post.author?.name ? { '@type': 'Person', name: post.author.name } : undefined,
              image: post.mainImage ? urlFor(post.mainImage).width(1200).height(630).url() : undefined,
              mainEntityOfPage: canonical,
            }),
          }}
        />
        {/* JSON-LD Breadcrumbs */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${siteUrl}/` },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
                post.categories?.[0]?.title
                  ? { '@type': 'ListItem', position: 3, name: post.categories[0].title, item: `${siteUrl}/blog/categorie/${post.categories[0].slug}` }
                  : undefined,
                { '@type': 'ListItem', position: 4, name: post.title, item: canonical },
              ].filter(Boolean),
            }),
          }}
        />

        {/* Hero */}
        <header className="relative pt-10 sm:pt-14 pb-10">
          <div className="w-full">
            <nav className="text-xs sm:text-sm text-muted-foreground mb-4">
              <Link href="/" className="hover:text-foreground transition-colors">Accueil</Link>
              <span className="mx-1.5">•</span>
              <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              {post.categories?.[0]?.slug ? (
                <>
                  <span className="mx-1.5">•</span>
                  <Link
                    href={`/blog/categorie/${typeof post.categories[0].slug === 'string' ? post.categories[0].slug : post.categories[0].slug?.current}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {post.categories[0].title}
                  </Link>
                </>
              ) : null}
            </nav>

            <div className="inline-flex flex-wrap gap-2 mb-4">
              {post.categories?.map((c: any) => {
                const slug = typeof c.slug === 'string' ? c.slug : c.slug?.current
                if (!slug) return null
                return (
                  <Link
                    key={slug}
                    href={`/blog/categorie/${slug}`}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                  >
                    {c.title}
                  </Link>
                )
              })}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              {post.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
              {post.publishedAt && (
                <span>{new Date(post.publishedAt).toLocaleDateString('fr-FR')}</span>
              )}
              {post.author?.name && (
                <>
                  <span>•</span>
                  <span>
                    par{' '}
                    <Link
                      href={`/blog/auteur/${typeof post.author.slug === 'string' ? post.author.slug : post.author.slug?.current}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {post.author.name}
                    </Link>
                  </span>
                </>
              )}
              {rt.minutes ? (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium bg-background/70 backdrop-blur">
                    {rt.minutes} min de lecture
                  </span>
                </>
              ) : null}
            </div>
          </div>

          {post.mainImage && (
            <div className="mt-8 relative h-56 sm:h-64 md:h-80 lg:h-96 rounded-3xl overflow-hidden border bg-neutral-900/10">
              <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-black/0 z-10" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urlFor(post.mainImage).width(1600).height(900).url()}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </header>

        {/* Article body */}
        <section className="relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/0 via-background to-background" />
          <div className="w-full mx-auto px-5 sm:px-7 md:px-10 py-8 md:py-10">
            {post.excerpt && (
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 border-l-4 border-emerald-500/70 pl-4">
                {post.excerpt}
              </p>
            )}

            {Array.isArray(post.sections) && post.sections.length > 0 ? (
              <div className="space-y-10 md:space-y-12">
                {post.sections.map((section: any) => {
                  const layout = section.layout || 'text'
                  const accent = section.accent || 'emerald'
                  const hasImage = !!section.image
                  const accentBorder =
                    accent === 'orange'
                      ? 'border-amber-500/80'
                      : accent === 'neutral'
                        ? 'border-neutral-300 dark:border-neutral-700'
                        : 'border-emerald-500/80'
                  const accentBg =
                    accent === 'orange'
                      ? 'bg-amber-50 dark:bg-amber-900/10'
                      : accent === 'neutral'
                        ? 'bg-neutral-50 dark:bg-neutral-900/40'
                        : 'bg-emerald-50 dark:bg-emerald-900/20'

                  if (layout === 'highlight') {
                    return (
                      <section
                        key={section._key}
                        className={`rounded-2xl border ${accentBorder} ${accentBg} px-5 sm:px-6 md:px-7 py-6 md:py-7`}
                      >
                        {section.title && (
                          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
                            {section.title}
                          </h2>
                        )}
                        <div className="prose prose-neutral dark:prose-invert prose-lg md:prose-xl max-w-none">
                          <RichText value={section.body || []} />
                        </div>
                      </section>
                    )
                  }

                  if (layout === 'quote') {
                    return (
                      <section
                        key={section._key}
                        className="rounded-2xl border border-emerald-500/50 bg-emerald-50/60 dark:bg-emerald-900/30 px-5 sm:px-6 md:px-7 py-6 md:py-7"
                      >
                        <div className="flex gap-3 md:gap-4">
                          <span className="text-4xl md:text-5xl leading-none text-emerald-500">“</span>
                          <div>
                            <div className="prose prose-neutral dark:prose-invert prose-lg md:prose-xl max-w-none italic">
                              <RichText value={section.body || []} />
                            </div>
                            {section.title && (
                              <p className="mt-3 text-sm md:text-base font-semibold text-emerald-900 dark:text-emerald-100">
                                {section.title}
                              </p>
                            )}
                          </div>
                        </div>
                      </section>
                    )
                  }

                  if ((layout === 'imageLeft' || layout === 'imageRight') && hasImage) {
                    const imageFirst = layout === 'imageLeft'
                    return (
                      <section
                        key={section._key}
                        className="grid md:grid-cols-2 gap-6 md:gap-8 items-center"
                      >
                        {imageFirst && (
                          <figure className="rounded-2xl overflow-hidden border bg-neutral-900/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={urlFor(section.image).width(1200).height(900).fit('crop').url()}
                              alt={section.image?.alt || ''}
                              className="w-full h-full object-cover"
                            />
                            {section.image?.caption && (
                              <figcaption className="px-4 py-3 text-xs text-muted-foreground bg-background/80">
                                {section.image.caption}
                              </figcaption>
                            )}
                          </figure>
                        )}

                        <div>
                          {section.title && (
                            <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4">
                              {section.title}
                            </h2>
                          )}
                          <div className="prose prose-neutral dark:prose-invert prose-lg md:prose-xl max-w-none">
                            <RichText value={section.body || []} />
                          </div>
                        </div>

                        {!imageFirst && (
                          <figure className="rounded-2xl overflow-hidden border bg-neutral-900/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={urlFor(section.image).width(1200).height(900).fit('crop').url()}
                              alt={section.image?.alt || ''}
                              className="w-full h-full object-cover"
                            />
                            {section.image?.caption && (
                              <figcaption className="px-4 py-3 text-xs text-muted-foreground bg-background/80">
                                {section.image.caption}
                              </figcaption>
                            )}
                          </figure>
                        )}
                      </section>
                    )
                  }

                  // Default text section
                  return (
                    <section key={section._key}>
                      {section.title && (
                        <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4">
                          {section.title}
                        </h2>
                      )}
                      <div className="prose prose-neutral dark:prose-invert prose-lg md:prose-xl max-w-none">
                        <RichText value={section.body || []} />
                      </div>
                    </section>
                  )
                })}
              </div>
            ) : (
              <div className="prose prose-neutral dark:prose-invert prose-lg md:prose-xl prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-img:rounded-2xl prose-li:marker:text-emerald-500 max-w-none">
                {/(^|\n)#{1,3}\s|\n\n|\[(.*?)\]\((.*?)\)/.test(normalizedBody)
                  ? (
                    <div dangerouslySetInnerHTML={{ __html: markdownToHtml(normalizedBody) }} />
                  ) : (
                    <RichText value={post.body} />
                  )}
              </div>
            )}
          </div>
        </section>

        {/* Related posts */}
        {related?.length ? (
          <section className="mt-12 md:mt-16 border-t pt-8 md:pt-10">
            <div className="flex items-center justify-between gap-4 mb-4 md:mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold">Articles associés</h2>
                <p className="text-sm text-muted-foreground">
                  Poursuis ta lecture sur des thèmes proches.
                </p>
              </div>
              <Link href="/blog" className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                Retour au blog
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-5 md:gap-6">
              {related.map((r: any) => (
                <article
                  key={r._id}
                  className="group border rounded-2xl overflow-hidden bg-background hover:border-emerald-500/60 hover:shadow-md transition-all duration-200"
                >
                  {r.mainImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={urlFor(r.mainImage).width(800).height(450).url()}
                      alt=""
                      className="w-full h-40 object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    />
                  )}
                  <div className="p-4 sm:p-5">
                    <h3 className="font-semibold text-base sm:text-lg leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      <Link href={`/blog/post/${r.slug}`}>{r.title}</Link>
                    </h3>
                    {r.publishedAt && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(r.publishedAt).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  )
}
