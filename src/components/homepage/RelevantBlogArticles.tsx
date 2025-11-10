'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { client } from '@/sanity/lib/client'
import { recentPostsQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'

export default function RelevantBlogArticles() {
  const [posts, setPosts] = useState<any[]>([])
  useEffect(() => {
    client.fetch(recentPostsQuery).then(setPosts).catch(() => setPosts([]))
  }, [])
  if (!posts.length) return null
  return (
    <section className="max-w-6xl mx-auto px-6 mt-16">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-2xl font-bold">Derniers articles</h2>
        <Link href="/blog" className="text-sm underline">Voir tout</Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((p) => (
          <article key={p._id} className="border rounded-2xl overflow-hidden">
            {p.mainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlFor(p.mainImage).width(800).height(450).url()} alt="" className="w-full h-44 object-cover" />
            ) : null}
            <div className="p-4">
              <h3 className="font-semibold leading-snug">
                <Link href={`/blog/post/${p.slug}`}>{p.title}</Link>
              </h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

