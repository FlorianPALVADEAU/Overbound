'use client'
import axiosClient from '@/app/api/axiosClient'
import { fetchSinglePost, useGetPost } from '@/app/api/blog/blogQueries'
import RichText from '@/components/RichText'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { postBySlugQuery, settingsQuery } from '@/sanity/lib/queries'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: any }) {
  const { slug } = await Promise.resolve(params)
  const [post, settings] = await Promise.all([
    fetchSinglePost(slug),
    axiosClient.get(settingsQuery),
  ])
  if (!post) return { title: 'Article introuvable — OverBound' }
  const title = `${post.title} — ${settings.data?.siteTitle || 'OverBound'}`
  const description = post.excerpt || settings.data?.description
  const og = post.ogImage || settings.data?.ogImage
  const images = og ? [{ url: urlFor(og).width(1200).height(630).url() }] : []
  return { title, description, openGraph: { title, description, images } }
}

export default function BlogPostPage({ params }: { params: any }) {
  const { slug } = params
  const { data: post, isLoading, error } = useGetPost(slug)

  if (isLoading) {
    return <div>Chargement...</div>
  }

  if (error || !post) {
    return <div>Article introuvable.</div>
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