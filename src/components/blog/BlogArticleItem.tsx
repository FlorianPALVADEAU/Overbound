"use client"
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import { Clock, ArrowRight } from 'lucide-react'

type PostLike = {
  _id: string
  title: string
  slug: string
  excerpt?: string | null
  publishedAt?: string | null
  mainImage?: any
  categories?: Array<{ title: string; slug: string }> | null
  readingTime?: number | null
}

interface Props {
  post: PostLike
  className?: string
  showExcerpt?: boolean
}

export default function BlogArticleItem({ post, className, showExcerpt = true }: Props) {
  const imgUrl = post.mainImage ? urlFor(post.mainImage).width(800).height(500).url() : null

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className || ''}`}
    >
      <Link href={`/blog/post/${post.slug}`} className="flex flex-col h-full">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {imgUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt={post.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <span className="text-6xl font-bold text-primary/20">{post.title[0]}</span>
            </div>
          )}

        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          {/* Reading time */}
          {post.readingTime && (
            <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{post.readingTime} min de lecture</span>
            </div>
          )}

          {/* Title */}
          <h2 className="mb-2 text-lg font-bold leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h2>

          {/* Excerpt */}
          {showExcerpt && post.excerpt && (
            <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
              {post.excerpt}
            </p>
          )}

          {/* Read more link */}
          <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <span>Lire l'article</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </article>
  )
}

