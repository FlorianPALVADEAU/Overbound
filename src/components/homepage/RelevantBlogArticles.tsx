'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { client } from '@/sanity/lib/client'
import { recentPostsQuery } from '@/sanity/lib/queries'
import BlogArticleItem from '@/components/blog/BlogArticleItem'
import { Container, Section, SectionHeader } from '@/components/ds'
import { Button } from '../ui/button'

export default function RelevantBlogArticles() {
  const [posts, setPosts] = useState<any[]>([])
  useEffect(() => {
    client.fetch(recentPostsQuery).then(setPosts).catch(() => setPosts([]))
  }, [])
  if (!posts.length) return null
  return (
    <Section>
      <Container className="flex flex-col gap-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader flush title="Articles de blog récents" />
          <Button asChild variant="outline" size="cta" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground lg:w-auto">
            <Link href="/blog">Voir tout</Link>
          </Button>
        </div>
        <div className="grid h-auto w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <BlogArticleItem key={p._id} post={p} showExcerpt={false} />
        ))}
        </div>
      </Container>
    </Section>
  )
}
