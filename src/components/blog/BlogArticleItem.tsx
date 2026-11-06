import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { DISPLAY_TITLE } from '@/components/ds'
import { getCategoryBySlug } from '@/lib/blog/categories'
import type { BlogPostSummary } from '@/lib/blog/types'
import { cn } from '@/lib/utils'

interface Props {
  post: BlogPostSummary
  className?: string
  showExcerpt?: boolean
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
})

export default function BlogArticleItem({ post, className, showExcerpt = true }: Props) {
  const category = getCategoryBySlug(post.category)?.title
  const publishedLabel = dateFormatter.format(new Date(post.publishedAt))

  return (
    // Only the title is a link; its ::after covers the whole card, so a click anywhere opens the article.
    // The card shows the focus ring because overflow-hidden would clip the link's own outline.
    <Card
      variant="default"
      className={cn(
        'group relative overflow-hidden p-0 gap-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
        className,
      )}
    >
      {/* Image: decorative, the title link carries the name */}
      <div className="relative aspect-16/10 overflow-hidden bg-muted">
        <Image
          src={post.mainImage}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Category, date, reading time */}
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {category ? <span className="font-medium text-foreground/80">{category}</span> : null}
          <time dateTime={post.publishedAt}>{publishedLabel}</time>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {post.readingTime} min de lecture
          </span>
        </div>

        {/* Title, the only link of the card */}
        <h2 className={cn(DISPLAY_TITLE, 'mb-3 text-title leading-tight line-clamp-3')}>
          <Link
            href={`/blog/post/${post.slug}`}
            className="transition-colors after:absolute after:inset-0 group-hover:text-primary"
          >
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        {showExcerpt && post.excerpt ? (
          <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">{post.excerpt}</p>
        ) : null}

        {/* Read more cue, not a second link */}
        <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
          <span>Lire l'article</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </div>
      </div>
    </Card>
  )
}
