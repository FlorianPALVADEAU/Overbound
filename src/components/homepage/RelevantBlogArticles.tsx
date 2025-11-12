'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { client } from '@/sanity/lib/client'
import { recentPostsQuery } from '@/sanity/lib/queries'
import BlogArticleItem from '@/components/blog/BlogArticleItem'
import Headings from '../globals/Headings'
import { Button } from '../ui/button'

export default function RelevantBlogArticles() {
  const [posts, setPosts] = useState<any[]>([])
  useEffect(() => {
    client.fetch(recentPostsQuery).then(setPosts).catch(() => setPosts([]))
  }, [])
  if (!posts.length) return null
  return (
    <section className="w-full px-4 py-12 flex flex-col gap-12 items-center justify-center sm:px-6 sm:py-16 xl:px-32">
      <div className='relative z-10 w-full'>
        <Headings
          title='Articles de blog récents'
          cta={
            <Link href='/blog'>
              <Button
                variant='outline'
                className='h-10 cursor-pointer w-full border-2 border-primary text-sm font-semibold text-[#26AA26] transition-all duration-300 hover:bg-[#26AA26] hover:text-white hover:shadow-lg hover:shadow-[#26AA26]/30 sm:h-11 sm:w-44 sm:text-base md:h-12 md:w-48'
              >
                Voir tout
              </Button>
            </Link>
          }
          sx='flex-row! justify-between!'
        />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full h-auto">
        {posts.map((p) => (
          <BlogArticleItem key={p._id} post={p} imageHeight={176} showExcerpt={false} />
        ))}
      </div>
    </section>
  )
}
