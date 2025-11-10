import { client } from '@/sanity/lib/client'
import { postsByAuthorSlugQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import Link from 'next/link'

export const revalidate = 60

type Params = Promise<{ slug: string }>
type SearchParams = Promise<{ page?: string }>

export default async function BlogAuthorPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params
  const { page } = await searchParams
  const pageSize = 12
  const current = Math.max(1, parseInt(page || '1', 10) || 1)
  const offset = (current - 1) * pageSize
  const end = offset + pageSize

  const { author, items, total } = await client.fetch(postsByAuthorSlugQuery, { slug, offset, end })
  const pageCount = Math.max(1, Math.ceil((total || 0) / pageSize))

  if (!author) {
    return <div className="max-w-5xl mx-auto p-6">Auteur introuvable.</div>
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Auteur: {author.name}</h1>
      {author.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlFor(author.avatar).width(120).height(120).url()} alt="" className="rounded-full w-24 h-24 mb-4" />
      ) : null}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items?.map((p: any) => (
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

      {pageCount > 1 && (
        <nav className="flex items-center justify-center gap-3 mt-8">
          {current > 1 && (
            <Link href={`/blog/auteur/${slug}?page=${current - 1}`} className="px-3 py-1 border rounded-full">Précédent</Link>
          )}
          <span className="text-sm opacity-70">Page {current} / {pageCount}</span>
          {current < pageCount && (
            <Link href={`/blog/auteur/${slug}?page=${current + 1}`} className="px-3 py-1 border rounded-full">Suivant</Link>
          )}
        </nav>
      )}
    </main>
  )}

