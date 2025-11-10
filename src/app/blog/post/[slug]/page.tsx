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
  const normalizedBody = bodyText.replace(/\\n/g, '\n')
  const rt = estimateReadingTime(bodyText)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
  const canonical = `${siteUrl}/blog/post/${post.slug}`

  return (
    <article className="max-w-3xl mx-auto p-6">
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
      <header className="space-y-3">
        {/* Breadcrumbs */}
        <nav className="text-sm text-muted-foreground">
          <Link href="/">Accueil</Link> • <Link href="/blog">Blog</Link>
          {post.categories?.[0]?.slug ? (
            <> • <Link href={`/blog/categorie/${typeof post.categories[0].slug === 'string' ? post.categories[0].slug : post.categories[0].slug?.current}`}>{post.categories[0].title}</Link></>
          ) : null}
        </nav>
        <h1 className="text-3xl font-bold leading-tight">{post.title}</h1>
        <div className="text-sm opacity-70">
          {post.publishedAt && new Date(post.publishedAt).toLocaleDateString('fr-FR')}
          {post.author?.name && (
            <> • par <Link href={`/blog/auteur/${typeof post.author.slug === 'string' ? post.author.slug : post.author.slug?.current}`}>{post.author.name}</Link></>
          )}
          {rt.minutes ? <> • {rt.minutes} min de lecture</> : null}
        </div>
        {post.mainImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urlFor(post.mainImage).width(1200).height(600).url()}
            alt=""
            className="rounded-2xl w-full"
          />
        )}
      </header>

      <div className="prose prose-neutral dark:prose-invert prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-2xl prose-li:marker:text-primary max-w-none mt-6">
        {/(^|\n)#{1,3}\s|\n\n|\[(.*?)\]\((.*?)\)/.test(normalizedBody)
          ? (
            <div dangerouslySetInnerHTML={{ __html: markdownToHtml(normalizedBody) }} />
          ) : (
            <RichText value={post.body} />
          )}
      </div>

      {related?.length ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Articles associés</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {related.map((r: any) => (
              <article key={r._id} className="border rounded-2xl overflow-hidden">
                {r.mainImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urlFor(r.mainImage).width(800).height(450).url()} alt="" className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-semibold">
                    <Link href={`/blog/post/${r.slug}`}>{r.title}</Link>
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  )
}
