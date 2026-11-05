import Link from 'next/link'
import Image from 'next/image'
import { Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { BlogPostSummary } from '@/lib/blog/types'

interface Props {
  post: BlogPostSummary
  className?: string
  showExcerpt?: boolean
}

export default function BlogArticleItem({ post, className, showExcerpt = true }: Props) {
  return (
    <Card
      variant="feature"
      className={cn('group gap-0 overflow-hidden p-0', className)}
    >
      <Link href={`/blog/post/${post.slug}`} className="flex h-full flex-col">
        {post.mainImage ? (
          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
            <Image
              src={post.mainImage}
              alt={post.mainImageAlt || post.title}
              fill
              sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 ease-standard group-hover:scale-105"
            />
          </div>
        ) : null}

        <div className="flex flex-1 flex-col gap-3 p-5">
          <h2 className={cn('text-title font-display font-bold uppercase leading-tight transition-colors group-hover:text-primary', 'line-clamp-2')}>
            {post.title}
          </h2>

          {showExcerpt && post.excerpt && (
            <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>par {post.author.name}</span>
            {post.readingTime ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {post.readingTime} min
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </Card>
  )
}
