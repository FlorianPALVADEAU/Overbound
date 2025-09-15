import { fetchSinglePost } from '@/app/api/blog/blogQueries'
import RichText from '@/components/RichText'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { settingsQuery } from '@/sanity/lib/queries'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

type PageParams = {
  params: {
    slug: string
  }
}

async function loadPost(slug: string) {
  try {
    return await fetchSinglePost(slug)
  } catch (error) {
    return null
  }
}

async function loadSettings() {
  try {
    return await client.fetch(settingsQuery)
  } catch (error) {
    return null
  }
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const slug = params.slug
  const [post, settings] = await Promise.all([loadPost(slug), loadSettings()])

  if (!post) {
    return {
      title: 'Article introuvable — OverBound',
    }
  }

  const siteTitle = settings?.siteTitle || 'OverBound'
  const title = `${post.title} — ${siteTitle}`
  const description = post.excerpt || settings?.description
  const ogImage = post.ogImage || settings?.ogImage
  const ogImageUrl = ogImage ? urlFor(ogImage).width(1200).height(630).url() : undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: PageParams) {
  const slug = params.slug
  const post = await loadPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <article className="max-w-3xl mx-auto p-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold leading-tight">{post.title}</h1>
        <div className="text-sm opacity-70">
          {post.publishedAt && new Date(post.publishedAt).toLocaleDateString('fr-FR')}
          {post.author?.name && <> • par {post.author.name}</>}
        </div>
        {post.mainImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={urlFor(post.mainImage).width(1200).height(600).url()} alt="" className="rounded-2xl w-full" />
        )}
      </header>

      <div className="prose prose-neutral max-w-none mt-6">
        <RichText value={post.body} />
      </div>
    </article>
  )
}
