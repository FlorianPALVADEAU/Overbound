import { client } from '@/sanity/lib/client'
import { authorsWithCountsQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import Link from 'next/link'

export const revalidate = 300

export default async function BlogAuthorsIndex() {
  const authors = await client.fetch(authorsWithCountsQuery)
  return (
    <main className="max-w-5xl mx-auto p-6 h-min-screen">
      <h1 className="text-3xl font-bold mb-6">Auteurs</h1>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {authors.map((a: any) => (
          <li key={a.slug} className="border rounded-xl p-4 flex items-center gap-3">
            {a.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlFor(a.avatar).width(56).height(56).url()} alt="" className="w-14 h-14 rounded-full" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gray-200" />
            )}
            <div className="flex-1">
              <Link href={`/blog/auteur/${a.slug}`} className="font-semibold">
                {a.name}
              </Link>
              <div className="text-xs opacity-60">{a.count} article(s)</div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}

