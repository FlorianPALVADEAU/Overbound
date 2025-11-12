import { client } from '@/sanity/lib/client'
import { postsByCategorySlugQuery } from '@/sanity/lib/queries'
import Link from 'next/link'
import Image from 'next/image'
import BlogArticleItem from '@/components/blog/BlogArticleItem'

export const revalidate = 60

export default async function BlogCategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ page?: string }> }) {
  const { slug } = await params
  const page = (await searchParams)?.page
  const pageSize = 12
  const current = Math.max(1, parseInt(page || '1', 10) || 1)
  const offset = (current - 1) * pageSize
  const end = offset + pageSize

  const { category, items, total } = await client.fetch(postsByCategorySlugQuery, { slug, offset, end })
  const pageCount = Math.max(1, Math.ceil((total || 0) / pageSize))

  if (!category) {
    return <div className="max-w-5xl mx-auto p-6">Catégorie introuvable.</div>
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      <section className="relative isolate overflow-hidden py-14">
        <div className="absolute inset-0">
          <Image src="/images/hero_header_poster.jpg" alt="Catégorie OverBound" fill sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-background/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/70 to-background" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Catégorie:&nbsp;{category.title}</h1>
        </div>
      </section>
      <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items?.map((p: any) => (
          <BlogArticleItem key={p._id} post={p} />
        ))}
      </div>

      {pageCount > 1 && (
        <nav className="flex items-center justify-center gap-3 mt-8">
          {current > 1 && (
            <Link href={`/blog/categorie/${slug}?page=${current - 1}`} className="px-3 py-1 border rounded-full">Précédent</Link>
          )}
          <span className="text-sm opacity-70">Page {current} / {pageCount}</span>
          {current < pageCount && (
            <Link href={`/blog/categorie/${slug}?page=${current + 1}`} className="px-3 py-1 border rounded-full">Suivant</Link>
          )}
        </nav>
      )}
      </div>
    </main>
  )
}
