import { client } from '@/sanity/lib/client'
import { categoriesWithCountsQuery } from '@/sanity/lib/queries'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 300

export default async function BlogCategoriesIndex() {
  const categories = await client.fetch(categoriesWithCountsQuery)
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      {/* Hero header */}
      <section className="relative isolate overflow-hidden py-14 sm:py-16">
        <div className="absolute inset-0">
          <Image
            src="/images/hero_header_poster.jpg"
            alt="Catégories du blog OverBound"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-background/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/70 to-background" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Catégories</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Explore nos thématiques pour trouver plus vite les conseils et les actus qui t’intéressent.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6">
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c: any, index: number) => (
            <li
              key={index}
              className="border rounded-xl flex items-center justify-between h-auto"
            >
              <Link href={`/blog/categorie/${c.slug}`} className="font-semibold w-full h-full hover:bg-primary/30 hover:border-primary p-4 rounded-xl">
                <div className="w-full flex items-center justify-between gap-2">
                  {c.title.charAt(0).toUpperCase() + c.title.slice(1)}
                  <span className="text-xs opacity-60">{c.count}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
