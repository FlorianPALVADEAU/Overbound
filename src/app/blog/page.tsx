import { client } from '@/sanity/lib/client'
import { paginatedPostsQuery, postsSearchQuery } from '@/sanity/lib/queries'
import Link from 'next/link'
import Image from 'next/image'
import BlogArticleItem from '@/components/blog/BlogArticleItem'

export const revalidate = 60

export default async function BlogIndex({ searchParams }: { searchParams?: Promise<{ page?: string; q?: string }> }) {
  const resolvedParams = await searchParams
  const page = resolvedParams?.page
  const q = resolvedParams?.q
  const pageSize = 12
  const current = Math.max(1, parseInt(page || '1', 10) || 1)
  const offset = (current - 1) * pageSize
  const end = offset + pageSize

  const query = (q && q.trim().length > 0)
    ? postsSearchQuery
    : paginatedPostsQuery
  const params = (q && q.trim().length > 0)
    ? { offset, end, q: `*${q.trim()}*` }
    : { offset, end }
  const { items: posts, total } = await client.fetch(query, params)
  const pageCount = Math.max(1, Math.ceil((total || 0) / pageSize))

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      {/* Hero header */}
      <section className="relative isolate overflow-hidden py-16 sm:py-20">
        <div className="absolute inset-0">
          <Image
            src="/images/hero_header_poster.jpg"
            alt="OverBound Blog"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-background/40 backdrop-blur-[2px]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/10 via-background/70 to-background" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm">
              La tribu OverBound
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Conseils, actus et coulisses</h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Entraînement, nutrition, préparation et histoires qui font vibrer nos courses. Tout pour progresser et kiffer sur les obstacles.
            </p>
            <div className="flex gap-3">
              <Link href="/blog/categories" className="px-4 py-2 rounded-full border text-sm hover:bg-background/50">
                Voir les catégories
              </Link>
              <Link href="/blog/auteurs" className="px-4 py-2 rounded-full border text-sm hover:bg-background/50">
                Nos auteurs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6">
      <form action="/blog" className="mb-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q || ''}
          placeholder="Rechercher un article (titre, extrait, contenu)"
          className="flex-1 border rounded-full px-4 py-2"
        />
        <button className="border rounded-full px-4">Rechercher</button>
      </form>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts?.map((p: any) => (
          <BlogArticleItem key={p._id} post={p} />
        ))}
      </div>

      {pageCount > 1 && (
        <nav className="flex items-center justify-center gap-3 mt-8">
          {current > 1 && (
            <Link href={`/blog?page=${current - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className="px-3 py-1 border rounded-full">Précédent</Link>
          )}
          <span className="text-sm opacity-70">Page {current} / {pageCount}</span>
          {current < pageCount && (
            <Link href={`/blog?page=${current + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className="px-3 py-1 border rounded-full">Suivant</Link>
          )}
        </nav>
      )}
      </div>
    </main>
  )
}
