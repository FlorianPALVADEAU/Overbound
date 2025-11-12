"use client"
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'

type PostLike = {
  _id: string
  title: string
  slug: string
  excerpt?: string | null
  publishedAt?: string | null
  mainImage?: any
}

interface Props {
  post: PostLike
  className?: string
  imageHeight?: number // in px, default 192 (h-48)
  showExcerpt?: boolean
}

export default function BlogArticleItem({ post, className, imageHeight = 192, showExcerpt = true }: Props) {
  const date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('fr-FR') : ''
  const imgUrl = post.mainImage ? urlFor(post.mainImage).width(800).height(450).url() : null

  return (
    <article className={`border h-20 rounded-2xl overflow-hidden bg-background ${className || ''}`}>
      <Link href={`/blog/post/${post.slug}`} className="w-full h-full flex flex-col">
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt="" style={{ height: imageHeight }} className="w-full object-cover" />
        ) : null}
        <div className="p-4">
          <h2 className="font-semibold text-lg leading-snug">
            {post.title}
          </h2>
          {showExcerpt && post.excerpt ? (
            <p className="text-sm opacity-80 mt-2 line-clamp-3">{post.excerpt}</p>
          ) : null}
          <div className="text-xs opacity-60 mt-3">{date}</div>
        </div>
      </Link>
    </article>
  )
}

