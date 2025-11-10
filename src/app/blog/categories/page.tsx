import { client } from '@/sanity/lib/client'
import { categoriesWithCountsQuery } from '@/sanity/lib/queries'
import Link from 'next/link'

export const revalidate = 300

export default async function BlogCategoriesIndex() {
  const categories = await client.fetch(categoriesWithCountsQuery)
  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Catégories</h1>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c: any) => (
          <li key={c.slug} className="border rounded-xl p-4 flex items-center justify-between">
            <Link href={`/blog/categorie/${c.slug}`} className="font-semibold">{c.title}</Link>
            <span className="text-xs opacity-60">{c.count}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}

