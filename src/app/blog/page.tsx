'use client'
import { urlFor } from '@/sanity/lib/image'
import Link from 'next/link'
import { useGetPosts } from '../api/blog/blogQueries'

export default function BlogIndex() {
  const { data: posts, isLoading, isError } = useGetPosts()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isError) {
    return <div>Error loading posts.</div>
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Blog</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts?.map((p: any) => (
          <article key={p._id} className="border rounded-2xl overflow-hidden">
            {p.mainImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlFor(p.mainImage).width(800).height(450).url()} alt="" className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <h2 className="font-semibold text-lg leading-snug">
                <Link href={`/blog/post/${p.slug}`}>{p.title}</Link>
              </h2>
              {p.excerpt && <p className="text-sm opacity-80 mt-2 line-clamp-3">{p.excerpt}</p>}
              <div className="text-xs opacity-60 mt-3">
                {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('fr-FR') : ''}
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}