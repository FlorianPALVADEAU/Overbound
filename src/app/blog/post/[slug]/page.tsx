import RichText from '@/components/RichText'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { postBySlugQuery, settingsQuery } from '@/sanity/lib/queries'
import { notFound } from 'next/navigation'



export const revalidate = 60

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  const [post, settings] = await Promise.all([
    client.fetch(postBySlugQuery, { slug: params.slug }),
    client.fetch(settingsQuery),
  ])
  if (!post) return { title: 'Article introuvable — OverBound' }
  const title = `${post.title} — ${settings?.siteTitle || 'OverBound'}`
  const description = post.excerpt || settings?.description
  const og = post.ogImage || settings?.ogImage
  const images = og ? [{ url: urlFor(og).width(1200).height(630).url() }] : []
  return { title, description, openGraph: { title, description, images } }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await client.fetch(postBySlugQuery, { slug: params.slug })
  if (!post) return notFound()

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